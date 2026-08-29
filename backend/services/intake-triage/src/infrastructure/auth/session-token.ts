import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Codec del token de sesión administrativa: firma/verifica HMAC. Es un
 * detalle de infraestructura (formato de token + criptografía), separado del
 * controller que decide qué hacer con el resultado.
 */
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function secret() {
  return process.env.ADMIN_SESSION_SECRET ?? "development-only-change-this-secret";
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export function issueSessionToken(username: string): { token: string; expiresAt: number } {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `${username}.${expiresAt}`;
  return { token: `${payload}.${sign(payload)}`, expiresAt };
}

export function verifySessionToken(token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [username, expiresAt, signature] = parts;
  const payload = `${username}.${expiresAt}`;
  const expectedSignature = sign(payload);
  const validSignature =
    signature.length === expectedSignature.length &&
    timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));

  return validSignature && Number(expiresAt) >= Math.floor(Date.now() / 1000) && username === process.env.ADMIN_USERNAME;
}
