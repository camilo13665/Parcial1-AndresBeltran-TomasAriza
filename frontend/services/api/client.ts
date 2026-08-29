/**
 * Cliente HTTP centralizado.
 *
 * En esta fase los microservicios solo exponen `/health`. Este cliente
 * queda preparado para que, en la siguiente fase, cada página consuma los
 * endpoints reales de Intake & Triage, Dispatch, Geospatial y Notification
 * sin tener que reescribir la capa de red.
 */

export const SERVICE_BASE_URL = {
  intake: process.env.NEXT_PUBLIC_INTAKE_URL ?? "http://localhost:3001",
  dispatch: process.env.NEXT_PUBLIC_DISPATCH_URL ?? "http://localhost:3002",
  geospatial: process.env.NEXT_PUBLIC_GEOSPATIAL_URL ?? "http://localhost:3003",
  notification: process.env.NEXT_PUBLIC_NOTIFICATION_URL ?? "http://localhost:3004",
} as const;

export type ServiceName = keyof typeof SERVICE_BASE_URL;

export interface HealthResponse {
  status: string;
  service: string;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: { path: string; message: string }[];
  };
}

class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly code?: string,
    public readonly details?: { path: string; message: string }[],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(service: ServiceName, path: string, init?: RequestInit): Promise<T> {
  const url = `${SERVICE_BASE_URL[service]}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError(`No fue posible conectar con ${service} (${url})`, undefined);
  }

  if (!response.ok) {
    let body: ApiErrorBody | null = null;
    try {
      body = await response.json();
    } catch {
      // el cuerpo no era JSON — se usa el mensaje genérico
    }
    throw new ApiError(
      body?.error?.message ?? `${service} respondió con estado ${response.status}`,
      response.status,
      body?.error?.code,
      body?.error?.details,
    );
  }

  return (await response.json()) as T;
}

export const apiClient = {
  /**
   * Consulta el health check de un microservicio específico. Usa el alias
   * con nombre ("/health/intake", no "/health") porque en producción los 4
   * servicios comparten el mismo origen (un único API Gateway) — "/health"
   * a secas no alcanza para distinguir cuál responde.
   */
  health: (service: ServiceName) => request<HealthResponse>(service, `/health/${service}`),

  /** Atajo genérico GET. */
  get: <T>(service: ServiceName, path: string, init?: RequestInit) => request<T>(service, path, { ...init, method: "GET" }),

  /** Atajo genérico POST. */
  post: <T>(service: ServiceName, path: string, body: unknown, init?: RequestInit) =>
    request<T>(service, path, { ...init, method: "POST", body: JSON.stringify(body) }),

  /** Atajo genérico PATCH. */
  patch: <T>(service: ServiceName, path: string, body: unknown, init?: RequestInit) =>
    request<T>(service, path, { ...init, method: "PATCH", body: JSON.stringify(body) }),
};

export { ApiError };

export const adminApi = {
  login: (username: string, password: string) =>
    apiClient.post<{ token: string; expiresAt: number }>("intake", "/admin/login", { username, password }),
  session: (token: string) =>
    apiClient.get<{ authenticated: boolean }>("intake", "/admin/session", {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

function adminHeaders(): HeadersInit {
  const token = typeof window === "undefined" ? null : sessionStorage.getItem("gestion-emergencias-admin-v2");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ---------------------------------------------------------------------------
// Intake & Triage
// ---------------------------------------------------------------------------

export interface CreateEmergencyPayload {
  tipo: string;
  ciudad: string;
  descripcion: string;
  latitud: number;
  longitud: number;
  datosEspecificos: Record<string, unknown>;
}

export const emergenciesApi = {
  create: (payload: CreateEmergencyPayload) => apiClient.post<import("@/types").Emergency>("intake", "/emergencies", payload),

  list: (filters?: { ciudad?: string; prioridad?: string; estado?: string }) => {
    const params = new URLSearchParams();
    if (filters?.ciudad) params.set("ciudad", filters.ciudad);
    if (filters?.prioridad) params.set("prioridad", filters.prioridad);
    if (filters?.estado) params.set("estado", filters.estado);
    const query = params.toString();
    return apiClient.get<{ data: import("@/types").Emergency[]; total: number }>(
      "intake",
      `/emergencies${query ? `?${query}` : ""}`,
    );
  },

  get: (id: string) => apiClient.get<import("@/types").Emergency>("intake", `/emergencies/${id}`),

  updateStatus: (id: string, estado: string) =>
    apiClient.patch<import("@/types").Emergency>("intake", `/emergencies/${id}/status`, { estado }, { headers: adminHeaders() }),

  stats: () =>
    apiClient.get<{
      total: number;
      porPrioridad: Record<string, number>;
      porCiudad: Record<string, number>;
    }>("intake", "/emergencies/stats"),
};

// ---------------------------------------------------------------------------
// Dispatch & Resource Assignment
// ---------------------------------------------------------------------------

export const resourcesApi = {
  list: (filters?: { ciudad?: string; tipo?: string; estado?: string }) => {
    const params = new URLSearchParams();
    if (filters?.ciudad) params.set("ciudad", filters.ciudad);
    if (filters?.tipo) params.set("tipo", filters.tipo);
    if (filters?.estado) params.set("estado", filters.estado);
    const query = params.toString();
    return apiClient.get<{ data: import("@/types").EmergencyResource[]; total: number }>(
      "dispatch",
      `/resources${query ? `?${query}` : ""}`,
    );
  },
};

export interface DispatchRecord {
  id: string;
  emergenciaId: string;
  recursoIds: string[];
  fechaAsignacion: string;
  notas?: string;
  sincronizacionIntake?: { ok: boolean; mensaje?: string };
}

export const dispatchesApi = {
  /** Asigna uno o más recursos a una emergencia. Dispatch valida contra Intake & Triage y, si procede, avanza el estado a ASIGNADA. */
  create: (emergenciaId: string, recursoIds: string[], notas?: string) =>
    apiClient.post<DispatchRecord>("dispatch", "/dispatches", { emergenciaId, recursoIds, notas }, { headers: adminHeaders() }),

  list: (emergenciaId?: string) =>
    apiClient.get<{ data: DispatchRecord[]; total: number }>(
      "dispatch",
      `/dispatches${emergenciaId ? `?emergenciaId=${emergenciaId}` : ""}`,
    ),
};

// ---------------------------------------------------------------------------
// Notification & Status Broadcast
// ---------------------------------------------------------------------------

export interface StatusChangeNotification {
  id: string;
  emergenciaId: string;
  estadoAnterior: string;
  estadoNuevo: string;
  mensaje: string;
  fechaCreacion: string;
}

export const notificationsApi = {
  list: (emergenciaId?: string) =>
    apiClient.get<{ data: StatusChangeNotification[]; total: number }>(
      "notification",
      `/notifications${emergenciaId ? `?emergenciaId=${emergenciaId}` : ""}`,
    ),
};

// ---------------------------------------------------------------------------
// Geospatial & Zone Aggregation
// ---------------------------------------------------------------------------

export interface ZoneStat {
  ciudad: string;
  nombre: string;
  centro: { latitud: number; longitud: number };
  total: number;
  porPrioridad: { CRITICA: number; ALTA: number; MEDIA: number; BAJA: number };
}

export const zonesApi = {
  /** Estadísticas por zona calculadas por Geospatial, que a su vez consulta a Intake & Triage por HTTP. */
  stats: () => apiClient.get<{ data: ZoneStat[]; fuente: string }>("geospatial", "/zones/stats"),
};
