import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

/**
 * Reemplazo de dotenv: nunca lee un archivo .env. En Lambda (detectado por
 * AWS_LAMBDA_FUNCTION_NAME) trae la configuración una sola vez por cold
 * start desde AWS Secrets Manager, usando el rol IAM de ejecución de la
 * función. Fuera de Lambda, usa las variables de entorno que ya inyectó el
 * contenedor (docker run / docker compose), nunca un archivo del repo.
 */

const SERVICE_NAME = "dispatch";
const REQUIRED_KEYS = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ADMIN_SESSION_SECRET",
  "ADMIN_USERNAME",
] as const;

let loaded: Promise<void> | null = null;

function isRunningOnLambda(): boolean {
  return Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
}

async function fetchFromSecretsManager(): Promise<void> {
  const stage = process.env.STAGE ?? "prod";
  const secretId = `emergencias/${stage}/${SERVICE_NAME}`;
  const client = new SecretsManagerClient({});
  const response = await client.send(new GetSecretValueCommand({ SecretId: secretId }));

  if (!response.SecretString) {
    throw new Error(`El secreto ${secretId} no tiene SecretString`);
  }

  const values = JSON.parse(response.SecretString) as Record<string, string>;
  for (const [key, value] of Object.entries(values)) {
    process.env[key] = value;
  }
}

/** Carga la configuración una sola vez por instancia y valida que esté completa. */
export async function loadConfig(): Promise<void> {
  if (!loaded) {
    loaded = isRunningOnLambda() ? fetchFromSecretsManager() : Promise.resolve();
  }
  await loaded;

  const missing = REQUIRED_KEYS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    const stage = process.env.STAGE ?? "prod";
    throw new Error(
      `Faltan variables de configuración: ${missing.join(", ")}. ` +
        `En Lambda deben existir en el secreto emergencias/${stage}/${SERVICE_NAME}; ` +
        `en local/Docker deben inyectarse como variables de entorno del contenedor.`,
    );
  }
}
