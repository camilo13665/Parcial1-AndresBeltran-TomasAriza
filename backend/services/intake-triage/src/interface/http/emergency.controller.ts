import type { FastifyReply, FastifyRequest } from "fastify";
import { container } from "../../composition/container";
import {
  CreateEmergencySchema,
  ListEmergenciesQuerySchema,
  UpdateStatusSchema,
} from "../dto/emergency.schema";

/** Controller delgado: solo valida el DTO de entrada y delega en el caso de uso — sin lógica de negocio. */
export async function createEmergency(request: FastifyRequest, reply: FastifyReply) {
  const input = CreateEmergencySchema.parse(request.body);
  const emergency = await container.createEmergencyUseCase.execute(input);
  return reply.status(201).send(emergency);
}

export async function listEmergencies(request: FastifyRequest, reply: FastifyReply) {
  const filters = ListEmergenciesQuerySchema.parse(request.query);
  const emergencies = await container.listEmergenciesUseCase.execute(filters);
  return reply.status(200).send({ data: emergencies, total: emergencies.length });
}

export async function getEmergency(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const emergency = await container.getEmergencyUseCase.execute(request.params.id);
  return reply.status(200).send(emergency);
}

export async function updateEmergencyStatus(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const { estado } = UpdateStatusSchema.parse(request.body);
  const emergency = await container.updateEmergencyStatusUseCase.execute(request.params.id, estado);
  return reply.status(200).send(emergency);
}

export async function getStats(_request: FastifyRequest, reply: FastifyReply) {
  return reply.status(200).send(await container.getEmergencyStatsUseCase.execute());
}
