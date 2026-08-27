import type { FastifyReply, FastifyRequest } from "fastify";
import { AggregateZonesSchema, ProximitySchema } from "../schemas/zone.schema";
import { geospatialService } from "../services/geospatial.service";

export function listZones(_request: FastifyRequest, reply: FastifyReply) {
  return reply.status(200).send({ data: geospatialService.listZones() });
}

/**
 * Agregación "manual": recibe la lista de emergencias en el body. Útil
 * para pruebas o para clientes que ya tienen los datos a mano.
 */
export function aggregateZones(request: FastifyRequest, reply: FastifyReply) {
  const input = AggregateZonesSchema.parse(request.body);
  return reply.status(200).send({ data: geospatialService.aggregate(input.emergencias) });
}

/**
 * Agregación "real": Geospatial consulta por HTTP las emergencias
 * vigentes en Intake & Triage y calcula las estadísticas por zona sobre
 * esos datos. Este es el endpoint que demuestra la comunicación entre
 * microservicios.
 */
export async function zoneStats(_request: FastifyRequest, reply: FastifyReply) {
  const data = await geospatialService.statsFromIntake();
  return reply.status(200).send({ data, fuente: "intake-triage" });
}

export function nearestZone(request: FastifyRequest, reply: FastifyReply) {
  const input = ProximitySchema.parse(request.body);
  return reply.status(200).send({ data: geospatialService.nearestZone(input) });
}
