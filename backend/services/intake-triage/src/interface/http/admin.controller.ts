import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { issueSessionToken, verifySessionToken } from "../../infrastructure/auth/session-token";

const LoginSchema = z.object({ username: z.string().min(1), password: z.string().min(1) });

export function loginAdmin(request: FastifyRequest, reply: FastifyReply) {
  const { username, password } = LoginSchema.parse(request.body);
  const expectedUsername = process.env.ADMIN_USERNAME;
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedUsername || !expectedPassword || username !== expectedUsername || password !== expectedPassword) {
    return reply.status(401).send({ error: { code: "UNAUTHORIZED", message: "Usuario o contraseña incorrectos" } });
  }

  const { token, expiresAt } = issueSessionToken(username);
  return reply.status(200).send({ token, expiresAt });
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  const authorization = request.headers.authorization;
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";

  if (!verifySessionToken(token)) {
    return reply.status(401).send({ error: { code: "UNAUTHORIZED", message: "Sesión administrativa inválida" } });
  }

  return;
}

export async function verifyAdmin(request: FastifyRequest, reply: FastifyReply) {
  const result = await requireAdmin(request, reply);
  if (result) return result;
  return reply.status(200).send({ authenticated: true });
}
