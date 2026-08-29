import type { FastifyInstance } from "fastify";
import { getHealth } from "../controllers/health.controller";

/** Registra las rutas de health check en la instancia de Fastify. */
export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", getHealth);
  // Alias con el nombre del servicio: detrás de un único API Gateway los 4
  // servicios comparten origen, y "/health" a secas colisionaría entre
  // ellos. Este alias es el que consume el frontend contra la nube.
  app.get("/health/geospatial", getHealth);
}
