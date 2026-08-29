import type { FastifyReply, FastifyRequest } from "fastify";
import { container } from "../../composition/container";
import { AggregateZonesSchema, ProximitySchema } from "../dto/zone.schema";

export function listZones(_request: FastifyRequest, reply: FastifyReply) {
  return reply.status(200).send({ data: container.listZonesUseCase.execute() });
}

/** Agregación "manual": recibe la lista de emergencias en el body. Útil para pruebas o clientes que ya tienen los datos a mano. */
export function aggregateZones(request: FastifyRequest, reply: FastifyReply) {
  const input = AggregateZonesSchema.parse(request.body);
  return reply.status(200).send({ data: container.aggregateZonesUseCase.execute(input.emergencias) });
}

/**
 * Agregación "real": Geospatial consulta por HTTP las emergencias vigentes
 * en Intake & Triage y calcula las estadísticas por zona sobre esos datos.
 * Este es el endpoint que demuestra la comunicación entre microservicios.
 */
export async function zoneStats(_request: FastifyRequest, reply: FastifyReply) {
  const data = await container.getZoneStatsFromIntakeUseCase.execute();
  return reply.status(200).send({ data, fuente: "intake-triage" });
}

export function nearestZone(request: FastifyRequest, reply: FastifyReply) {
  const input = ProximitySchema.parse(request.body);
  return reply.status(200).send({ data: container.findNearestZoneUseCase.execute(input) });
}
