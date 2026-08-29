import type { FastifyReply, FastifyRequest } from "fastify";
import { verifySessionToken } from "../../infrastructure/auth/session-token";

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  const authorization = request.headers.authorization;
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";

  if (!verifySessionToken(token)) {
    return reply.status(401).send({ error: { code: "UNAUTHORIZED", message: "Se requiere una sesión administrativa" } });
  }
}
