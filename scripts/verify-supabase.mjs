// Smoke test de la configuración de Supabase: conectividad, tablas,
// políticas RLS y la función PostGIS `nearby_resources`.
//
// Uso:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... [SUPABASE_ANON_KEY=...] \
//     node scripts/verify-supabase.mjs
//
// No lee ningún archivo .env — las credenciales se exportan en la shell,
// igual que las usan los microservicios en local/Docker.

const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;

const results = [];

function report(name, status, detail) {
  results.push({ name, status, detail });
}

async function restRequest(key, path, init = {}) {
  let response;
  try {
    response = await fetch(`${url}/rest/v1/${path}`, {
      ...init,
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        ...(init.body ? { Prefer: init.headers?.Prefer ?? "return=minimal" } : {}),
        ...init.headers,
      },
    });
  } catch (err) {
    // SUPABASE_URL apunta a un host inválido/inalcanzable, DNS caído, etc.
    const cause = err?.cause?.message ?? err?.message ?? String(err);
    return { ok: false, status: 0, networkError: cause, body: undefined };
  }
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch {
    body = text;
  }
  return { ok: response.ok, status: response.status, body };
}

async function checkEnv() {
  if (!url || !serviceKey) {
    report(
      "Variables de entorno",
      "FAIL",
      "Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY. Expórtalas en la shell antes de correr este script.",
    );
    return false;
  }
  report("Variables de entorno", "OK", `SUPABASE_URL=${url}`);
  if (!anonKey) {
    report(
      "SUPABASE_ANON_KEY",
      "WARN",
      "No está definida — se omiten las pruebas de RLS con la anon key (necesarias para validar el acceso público de solo lectura).",
    );
  }
  return true;
}

async function checkTable(table) {
  const res = await restRequest(serviceKey, `${table}?select=id&limit=1`);
  if (res.networkError) {
    report(`Tabla ${table}`, "FAIL", `No se pudo conectar a ${url}: ${res.networkError}. Revisa que SUPABASE_URL sea correcta.`);
  } else if (res.ok) {
    report(`Tabla ${table}`, "OK", "Accesible con la service role key.");
  } else if (res.status === 404 || res.status === 406) {
    report(`Tabla ${table}`, "FAIL", `No existe (status ${res.status}). Corre docs/migrations/001_initial_schema.sql.`);
  } else if (res.status === 401 || res.status === 403) {
    report(`Tabla ${table}`, "FAIL", `Rechazado (status ${res.status}). Revisa que SUPABASE_SERVICE_ROLE_KEY sea la clave service_role, no la anon.`);
  } else {
    report(`Tabla ${table}`, "FAIL", `Status inesperado ${res.status}: ${JSON.stringify(res.body)}`);
  }
}

async function checkPostgis() {
  const res = await restRequest(serviceKey, "rpc/nearby_resources", {
    method: "POST",
    body: JSON.stringify({ lat: 0, lng: 0, radio_metros: 1, solo_disponibles: true }),
  });
  if (res.networkError) {
    report("PostGIS (rpc/nearby_resources)", "FAIL", `No se pudo conectar a ${url}: ${res.networkError}.`);
  } else if (res.ok) {
    report("PostGIS (rpc/nearby_resources)", "OK", "La función existe y responde (extensión postgis habilitada).");
  } else if (res.status === 404 && String(res.body?.code) === "PGRST202") {
    report(
      "PostGIS (rpc/nearby_resources)",
      "FAIL",
      "La función no existe para PostgREST. Corre docs/migrations/002_rls_and_postgis.sql y luego NOTIFY pgrst, 'reload schema';",
    );
  } else {
    report("PostGIS (rpc/nearby_resources)", "FAIL", `Status ${res.status}: ${JSON.stringify(res.body)}`);
  }
}

async function checkRlsWithAnonKey() {
  if (!anonKey) return;

  const read = await restRequest(anonKey, "emergencies?select=id&limit=1");
  if (read.networkError) {
    report("RLS — lectura con anon key", "FAIL", `No se pudo conectar a ${url}: ${read.networkError}.`);
    return;
  }
  if (read.ok) {
    report("RLS — lectura con anon key", "OK", "SELECT permitido (política 'lectura publica' activa).");
  } else {
    report(
      "RLS — lectura con anon key",
      "FAIL",
      `SELECT bloqueado (status ${read.status}). Corre docs/migrations/002_rls_and_postgis.sql.`,
    );
  }

  const write = await restRequest(anonKey, "resources", {
    method: "POST",
    body: JSON.stringify({ tipo: "BOMBEROS", organismo: "verify-supabase smoke test", ciudad: "CALI", estado: "DISPONIBLE" }),
  });
  if (write.status === 401 || write.status === 403) {
    report("RLS — escritura con anon key", "OK", `Bloqueada correctamente (status ${write.status}).`);
  } else if (write.ok) {
    report(
      "RLS — escritura con anon key",
      "FAIL",
      "¡La anon key pudo insertar una fila! Revisa que no exista una policy de INSERT/UPDATE/DELETE para anon en resources.",
    );
  } else {
    report("RLS — escritura con anon key", "WARN", `Status inesperado ${write.status}: ${JSON.stringify(write.body)}`);
  }
}

async function main() {
  const envOk = await checkEnv();
  if (envOk) {
    for (const table of ["emergencies", "resources", "dispatches", "notifications"]) {
      await checkTable(table);
    }
    await checkPostgis();
    await checkRlsWithAnonKey();
  }

  const icon = { OK: "✅", WARN: "⚠️ ", FAIL: "❌" };
  console.log("\n=== Verificación de Supabase ===\n");
  for (const r of results) {
    console.log(`${icon[r.status]} ${r.name}`);
    console.log(`   ${r.detail}\n`);
  }

  const hasFail = results.some((r) => r.status === "FAIL");
  console.log(hasFail ? "Resultado: hay problemas por resolver." : "Resultado: todo OK.");
  process.exit(hasFail ? 1 : 0);
}

main();
