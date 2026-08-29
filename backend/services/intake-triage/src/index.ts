import Fastify from "fastify";
import cors from "@fastify/cors";
import { ZodError } from "zod";
import { healthRoutes } from "./interface/http/health.routes";
import { emergencyRoutes } from "./interface/http/emergency.routes";
import { adminRoutes } from "./interface/http/admin.routes";
import { AppError } from "./domain/errors";
import { loadConfig } from "./infrastructure/config/secrets";

/**
 * Intake & Triage
 * ----------------
 * Recibe emergencias reportadas, las valida, clasifica su prioridad (triage)
 * y expone su consulta. Organizado en capas (Clean Architecture):
 * domain/ (entidades + puertos) <- application/ (casos de uso) <-
 * interface/http/ (Fastify) — con infrastructure/ implementando los puertos
 * y composition/container.ts cableando todo en el borde del sistema.
 */

const PORT = Number(process.env.PORT ?? 3001);
const SERVICE_NAME = "intake-triage";

async function main() {
  await loadConfig();

  const app = Fastify({ logger: true });

  // El error handler debe registrarse ANTES de los plugins de rutas: Fastify
  // encapsula cada `register()` en su propio contexto, que hereda el
  // errorHandler vigente EN ESE MOMENTO. Si se registra después, las rutas
  // ya cargadas siguen usando el handler por defecto.
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
  await app.register(emergencyRoutes);
  await app.register(adminRoutes);

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
