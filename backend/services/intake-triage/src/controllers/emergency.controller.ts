import type { FastifyReply, FastifyRequest } from "fastify";
import {
  CreateEmergencySchema,
  ListEmergenciesQuerySchema,
  UpdateStatusSchema,
} from "../schemas/emergency.schema";
import { emergencyService } from "../services/emergency.service";
import { notificationClient } from "../clients/notification.client";
import { dispatchClient } from "../clients/dispatch.client";

export async function createEmergency(request: FastifyRequest, reply: FastifyReply) {
  const input = CreateEmergencySchema.parse(request.body);
  const emergency = await emergencyService.create(input);
  return reply.status(201).send(emergency);
}

export async function listEmergencies(request: FastifyRequest, reply: FastifyReply) {
  const filters = ListEmergenciesQuerySchema.parse(request.query);
  const emergencies = await emergencyService.list(filters);
  return reply.status(200).send({ data: emergencies, total: emergencies.length });
}

export async function getEmergency(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const emergency = await emergencyService.getById(request.params.id);
  return reply.status(200).send(emergency);
}

export async function updateEmergencyStatus(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const { estado } = UpdateStatusSchema.parse(request.body);

  const estadoAnterior = (await emergencyService.getById(request.params.id)).estado;
  const emergency = await emergencyService.updateStatus(request.params.id, estado);

  // "Best effort", pero SIEMPRE con await: en Lambda el proceso se congela
  // apenas se devuelve la respuesta, así que una llamada fire-and-forget
  // (sin await) puede quedar a medio terminar y nunca completarse. Los
  // clientes ya atrapan sus propios errores y tienen timeout de 3s, así que
  // esperar su resultado no rompe la respuesta principal si el otro
  // servicio falla — solo evita que Lambda mate la llamada en pleno vuelo.
  await notificationClient.notifyStatusChange(emergency.id, estadoAnterior, emergency.estado);
  if (emergency.estado === "RESUELTA" || emergency.estado === "CANCELADA") {
    await dispatchClient.releaseResources(emergency.id);
  }

  return reply.status(200).send(emergency);
}

export async function getStats(_request: FastifyRequest, reply: FastifyReply) {
  return reply.status(200).send(await emergencyService.stats());
}
