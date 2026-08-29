import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verifica tokens de sesión administrativa emitidos por Intake & Triage
 * (comparten ADMIN_SESSION_SECRET / ADMIN_USERNAME vía Secrets Manager).
 * Dispatch no emite tokens, solo los verifica.
 */
function sign(payload: string): string {
  return createHmac("sha256", process.env.ADMIN_SESSION_SECRET ?? "").update(payload).digest("hex");
}

export function verifySessionToken(token: string): boolean {
  const [username, expiresAt, signature] = token.split(".");
  if (!username || !expiresAt || !signature) return false;

  const payload = `${username}.${expiresAt}`;
  const expected = sign(payload);
  const valid = signature.length === expected.length && timingSafeEqual(Buffer.from(signature), Buffer.from(expected));

  return valid && Number(expiresAt) >= Math.floor(Date.now() / 1000) && username === process.env.ADMIN_USERNAME;
}
