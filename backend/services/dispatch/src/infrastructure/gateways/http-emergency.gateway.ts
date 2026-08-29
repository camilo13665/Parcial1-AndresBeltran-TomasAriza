import { NotFoundError, UpstreamServiceError } from "../../domain/errors";
import { EmergencyGateway, RemoteEmergency } from "../../domain/ports/emergency-gateway.port";

/**
 * Adapter HTTP hacia Intake & Triage. Si Intake & Triage no responde,
 * Dispatch falla de forma explícita (502) en vez de asumir que la
 * emergencia es válida.
 */
const INTAKE_SERVICE_URL = process.env.INTAKE_SERVICE_URL ?? "http://localhost:3001";
const TIMEOUT_MS = 3000;

async function safeFetch(url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new UpstreamServiceError(`No se pudo conectar con Intake & Triage (${url}): ${reason}`);
  }
}

export class HttpEmergencyGateway implements EmergencyGateway {
  async getEmergency(id: string): Promise<RemoteEmergency> {
    const response = await safeFetch(`${INTAKE_SERVICE_URL}/emergencies/${id}`);

    if (response.status === 404) {
      throw new NotFoundError(`Intake & Triage no tiene registrada una emergencia con id ${id}`);
    }
    if (!response.ok) {
      throw new UpstreamServiceError(`Intake & Triage respondió con estado ${response.status} al consultar ${id}`);
    }
    return (await response.json()) as RemoteEmergency;
  }

  async updateStatus(id: string, estado: string, authorization?: string): Promise<RemoteEmergency> {
    const response = await safeFetch(`${INTAKE_SERVICE_URL}/emergencies/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(authorization ? { Authorization: authorization } : {}) },
      body: JSON.stringify({ estado }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
      const message = body?.error?.message ?? `Intake & Triage respondió con estado ${response.status}`;
      throw new UpstreamServiceError(`No se pudo actualizar el estado en Intake & Triage: ${message}`);
    }
    return (await response.json()) as RemoteEmergency;
  }
}
