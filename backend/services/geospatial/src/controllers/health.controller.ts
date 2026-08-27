import type { FastifyReply, FastifyRequest } from "fastify";

/**
 * Controlador de health check.
 * Confirma que el microservicio esta arriba y correctamente aislado de los
 * demas. No depende de base de datos ni de otros servicios.
 */
export function getHealth(_request: FastifyRequest, reply: FastifyReply) {
  return reply.status(200).send({
    status: "ok",
    service: "geospatial",
  });
}
