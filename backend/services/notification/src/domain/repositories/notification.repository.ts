import { StatusChangeNotification } from "../entities/notification.entity";

/** Puerto de persistencia — los casos de uso dependen de esta interfaz, nunca de Supabase directamente. */
export interface NotificationRepository {
  create(notification: StatusChangeNotification): Promise<StatusChangeNotification>;
  list(emergenciaId?: string): Promise<StatusChangeNotification[]>;
  findById(id: string): Promise<StatusChangeNotification | null>;
}
