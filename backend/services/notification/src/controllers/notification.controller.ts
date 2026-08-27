import type { FastifyReply, FastifyRequest } from "fastify";
import { CreateNotificationSchema, ListNotificationsQuerySchema } from "../schemas/notification.schema";
import { notificationService } from "../services/notification.service";

export async function createNotification(request: FastifyRequest, reply: FastifyReply) {
  const input = CreateNotificationSchema.parse(request.body);
  const notification = await notificationService.create(input);
  return reply.status(201).send(notification);
}

export async function listNotifications(request: FastifyRequest, reply: FastifyReply) {
  const { emergenciaId } = ListNotificationsQuerySchema.parse(request.query);
  const items = await notificationService.list(emergenciaId);
  return reply.status(200).send({ data: items, total: items.length });
}

export async function getNotification(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const notification = await notificationService.getById(request.params.id);
  return reply.status(200).send(notification);
}
