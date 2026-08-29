import Fastify from "fastify";
import cors from "@fastify/cors";
import { ZodError } from "zod";
import { healthRoutes } from "./interface/http/health.routes";
import { zoneRoutes } from "./interface/http/zone.routes";
import { AppError } from "./domain/errors";
import { loadConfig } from "./infrastructure/config/secrets";

/**
 * Geospatial & Zone Aggregation
 * ------------------------------
 * Responsabilidades:
 *  - exponer metadata de las zonas monitoreadas (Chocó, Pereira, Cali,
 *    Manizales);
 *  - agregar emergencias por zona y prioridad (stateless: recibe los
 *    datos vigentes en el request, ya que aún no hay bus de eventos ni
 *    base de datos compartida entre microservicios);
 *  - calcular proximidad a la zona monitoreada más cercana.
 */

const PORT = Number(process.env.PORT ?? 3003);
const SERVICE_NAME = "geospatial";

async function main() {
  await loadConfig();

  const app = Fastify({ logger: true });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "Datos inválidos",
          details: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
        },
      });
    }
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ error: { code: error.code, message: error.message } });
    }
    request.log.error(error);
    return reply.status(500).send({ error: { code: "INTERNAL_ERROR", message: "Error interno del servidor" } });
  });

  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      error: { code: "ROUTE_NOT_FOUND", message: `Ruta no encontrada: ${request.method} ${request.url}` },
    });
  });

  await app.register(cors, { origin: true });
  await app.register(healthRoutes);
  await app.register(zoneRoutes);

  try {
    await app.listen({ port: PORT, host: "0.0.0.0" });
    app.log.info(`${SERVICE_NAME} escuchando en http://localhost:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`${SERVICE_NAME}: fallo al iniciar —`, err);
  process.exit(1);
});
