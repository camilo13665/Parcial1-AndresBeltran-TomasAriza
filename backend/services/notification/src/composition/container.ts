import { CreateNotificationUseCase } from "../application/use-cases/create-notification.usecase";
import { GetNotificationUseCase } from "../application/use-cases/get-notification.usecase";
import { ListNotificationsUseCase } from "../application/use-cases/list-notifications.usecase";
import { PostgrestClient } from "../infrastructure/persistence/postgrest-client";
import { SupabaseNotificationRepository } from "../infrastructure/persistence/supabase-notification.repository";

/**
 * Composition root: el único lugar del servicio que conoce las clases
 * concretas de infraestructura (Dependency Inversion aplicada en la práctica).
 */
const postgrestClient = new PostgrestClient();
const notificationRepository = new SupabaseNotificationRepository(postgrestClient);

export const container = {
  createNotificationUseCase: new CreateNotificationUseCase(notificationRepository),
  listNotificationsUseCase: new ListNotificationsUseCase(notificationRepository),
  getNotificationUseCase: new GetNotificationUseCase(notificationRepository),
};
