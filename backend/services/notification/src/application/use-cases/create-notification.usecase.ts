import { NewNotificationInput, StatusChangeNotification } from "../../domain/entities/notification.entity";
import { NotificationRepository } from "../../domain/repositories/notification.repository";

export class CreateNotificationUseCase {
  constructor(private readonly repository: NotificationRepository) {}

  execute(input: NewNotificationInput): Promise<StatusChangeNotification> {
    const notification = StatusChangeNotification.create(input, `NOT-${Date.now()}`, new Date().toISOString());
    return this.repository.create(notification);
  }
}
