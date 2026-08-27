import type { FastifyInstance } from "fastify";
import { getHealth } from "../controllers/health.controller";

/** Registra las rutas de health check en la instancia de Fastify. */
export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", getHealth);
}
