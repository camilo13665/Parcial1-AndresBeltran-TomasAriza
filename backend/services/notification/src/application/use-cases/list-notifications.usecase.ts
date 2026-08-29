import { StatusChangeNotification } from "../../domain/entities/notification.entity";
import { NotificationRepository } from "../../domain/repositories/notification.repository";

export class ListNotificationsUseCase {
  constructor(private readonly repository: NotificationRepository) {}

  execute(emergenciaId?: string): Promise<StatusChangeNotification[]> {
    return this.repository.list(emergenciaId);
  }
}
