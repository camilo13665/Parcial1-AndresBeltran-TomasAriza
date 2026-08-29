import type { FastifyReply, FastifyRequest } from "fastify";
import { container } from "../../composition/container";
import { CreateNotificationSchema, ListNotificationsQuerySchema } from "../dto/notification.schema";

export async function createNotification(request: FastifyRequest, reply: FastifyReply) {
  const input = CreateNotificationSchema.parse(request.body);
  const notification = await container.createNotificationUseCase.execute(input);
  return reply.status(201).send(notification);
}

export async function listNotifications(request: FastifyRequest, reply: FastifyReply) {
  const { emergenciaId } = ListNotificationsQuerySchema.parse(request.query);
  const items = await container.listNotificationsUseCase.execute(emergenciaId);
  return reply.status(200).send({ data: items, total: items.length });
}

export async function getNotification(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const notification = await container.getNotificationUseCase.execute(request.params.id);
  return reply.status(200).send(notification);
}
