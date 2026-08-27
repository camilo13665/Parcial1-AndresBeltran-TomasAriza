export async function supabaseQuery<T>(table: string, query = "", init: RequestInit = {}): Promise<T> {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el backend");
  const response = await fetch(`${url}/rest/v1/${table}${query ? `?${query}` : ""}`, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(init.body ? { Prefer: "return=representation" } : {}), ...init.headers },
  });
  if (!response.ok) throw new Error(`Supabase respondió ${response.status}: ${await response.text()}`);
  if (response.status === 204) return undefined as T;
  const body = await response.text();
  return (body ? JSON.parse(body) : undefined) as T;
}
