import Fastify from "fastify";
import cors from "@fastify/cors";
import { ZodError } from "zod";
import { healthRoutes } from "./interface/http/health.routes";
import { notificationRoutes } from "./interface/http/notification.routes";
import { AppError } from "./domain/errors";
import { loadConfig } from "./infrastructure/config/secrets";

/**
 * Notification & Status Broadcast
 * ---------------------------------
 * Responsabilidades:
 *  - registrar eventos de cambio de estado de una emergencia;
 *  - exponer el historial de eventos para consulta (polling).
 *
 * La transmisión en tiempo real (Webhooks / Realtime) se implementará en
 * una fase posterior; por ahora el "broadcast" es simplemente dejar el
 * evento disponible vía GET /notifications.
 */

const PORT = Number(process.env.PORT ?? 3004);
const SERVICE_NAME = "notification";

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
  await app.register(notificationRoutes);

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
