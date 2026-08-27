import { createHmac, timingSafeEqual } from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

const LoginSchema = z.object({ username: z.string().min(1), password: z.string().min(1) });
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function secret() {
  return process.env.ADMIN_SESSION_SECRET ?? "development-only-change-this-secret";
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export function loginAdmin(request: FastifyRequest, reply: FastifyReply) {
  const { username, password } = LoginSchema.parse(request.body);
  const expectedUsername = process.env.ADMIN_USERNAME;
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedUsername || !expectedPassword || username !== expectedUsername || password !== expectedPassword) {
    return reply.status(401).send({ error: { code: "UNAUTHORIZED", message: "Usuario o contraseña incorrectos" } });
  }

  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `${username}.${expiresAt}`;
  return reply.status(200).send({ token: `${payload}.${sign(payload)}`, expiresAt });
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  const authorization = request.headers.authorization;
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  const parts = token.split(".");

  if (parts.length !== 3) {
    return reply.status(401).send({ error: { code: "UNAUTHORIZED", message: "Sesión administrativa inválida" } });
  }

  const [username, expiresAt, signature] = parts;
  const payload = `${username}.${expiresAt}`;
  const expectedSignature = sign(payload);
  const validSignature = signature.length === expectedSignature.length &&
    timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));

  if (!validSignature || Number(expiresAt) < Math.floor(Date.now() / 1000) || username !== process.env.ADMIN_USERNAME) {
    return reply.status(401).send({ error: { code: "UNAUTHORIZED", message: "Sesión administrativa inválida" } });
  }

  return;
}

export async function verifyAdmin(request: FastifyRequest, reply: FastifyReply) {
  const result = await requireAdmin(request, reply);
  if (result) return result;
  return reply.status(200).send({ authenticated: true });
}