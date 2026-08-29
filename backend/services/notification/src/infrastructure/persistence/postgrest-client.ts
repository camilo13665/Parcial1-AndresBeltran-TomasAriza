function getConfig() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el entorno del backend");
  }
  return { url: supabaseUrl.replace(/\/$/, ""), key: serviceRoleKey };
}

/** Cliente PostgREST de bajo nivel — el único punto de la capa de infraestructura que habla con Supabase por HTTP. */
export class PostgrestClient {
  async request<T>(table: string, init: RequestInit = {}): Promise<T> {
    const config = getConfig();
    const response = await fetch(`${config.url}/rest/v1/${table}`, {
      ...init,
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        "Content-Type": "application/json",
        ...(init.body ? { Prefer: "return=representation" } : {}),
        ...init.headers,
      },
    });
    if (!response.ok) throw new Error(`Supabase respondió ${response.status} para ${table}: ${await response.text()}`);
    if (response.status === 204) return undefined as T;
    const body = await response.text();
    return (body ? JSON.parse(body) : undefined) as T;
  }

  query<T>(table: string, query = "", init?: RequestInit) {
    return this.request<T>(`${table}${query ? `?${query}` : ""}`, { ...init, method: init?.method ?? "GET" });
  }
}
