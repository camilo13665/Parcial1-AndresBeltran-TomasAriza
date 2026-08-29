import { StatusChangeNotification } from "../../domain/entities/notification.entity";
import { NotFoundError } from "../../domain/errors";
import { NotificationRepository } from "../../domain/repositories/notification.repository";

export class GetNotificationUseCase {
  constructor(private readonly repository: NotificationRepository) {}

  async execute(id: string): Promise<StatusChangeNotification> {
    const notification = await this.repository.findById(id);
    if (!notification) throw new NotFoundError(`No existe una notificación con id ${id}`);
    return notification;
  }
}
