const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getConfig() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el entorno del backend");
  }
  return { url: SUPABASE_URL.replace(/\/$/, ""), key: SUPABASE_SERVICE_ROLE_KEY };
}

export async function supabaseRequest<T>(table: string, init: RequestInit = {}): Promise<T> {
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

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase respondió ${response.status} para ${table}: ${detail}`);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function supabaseQuery<T>(table: string, query: string, init?: RequestInit) {
  const params = query ? `?${query}` : "";
  return supabaseRequest<T>(`${table}${params}`, {
    ...init,
    method: init?.method ?? "GET",
    headers: { ...(init?.headers ?? {}), "Content-Profile": "public" },
  });
}
