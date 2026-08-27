import { createHmac, timingSafeEqual } from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";

function sign(payload: string) {
  return createHmac("sha256", process.env.ADMIN_SESSION_SECRET ?? "").update(payload).digest("hex");
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  const token = request.headers.authorization?.startsWith("Bearer ") ? request.headers.authorization.slice(7) : "";
  const [username, expiresAt, signature] = token.split(".");
  const payload = `${username}.${expiresAt}`;
  const expected = sign(payload);
  const valid = signature?.length === expected.length && timingSafeEqual(Buffer.from(signature), Buffer.from(expected));

  if (!valid || Number(expiresAt) < Math.floor(Date.now() / 1000) || username !== process.env.ADMIN_USERNAME) {
    return reply.status(401).send({ error: { code: "UNAUTHORIZED", message: "Se requiere una sesión administrativa" } });
  }
}