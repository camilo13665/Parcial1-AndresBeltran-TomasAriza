import { NotificationProps, StatusChangeNotification } from "../../domain/entities/notification.entity";
import { NotificationRepository } from "../../domain/repositories/notification.repository";
import { PostgrestClient } from "./postgrest-client";

type NotificationRow = {
  id: string;
  emergencia_id: string;
  estado_anterior: string;
  estado_nuevo: string;
  mensaje: string;
  fecha_creacion: string;
};

function fromRow(row: NotificationRow): StatusChangeNotification {
  return new StatusChangeNotification({
    id: row.id,
    emergenciaId: row.emergencia_id,
    estadoAnterior: row.estado_anterior as NotificationProps["estadoAnterior"],
    estadoNuevo: row.estado_nuevo as NotificationProps["estadoNuevo"],
    mensaje: row.mensaje,
    fechaCreacion: row.fecha_creacion,
  });
}

/** Implementación concreta del puerto NotificationRepository sobre Supabase/PostgREST. */
export class SupabaseNotificationRepository implements NotificationRepository {
  constructor(private readonly client: PostgrestClient) {}

  async create(notification: StatusChangeNotification): Promise<StatusChangeNotification> {
    const rows = await this.client.query<NotificationRow[]>("notifications", "", {
      method: "POST",
      body: JSON.stringify({
        id: notification.id,
        emergencia_id: notification.emergenciaId,
        estado_anterior: notification.estadoAnterior,
        estado_nuevo: notification.estadoNuevo,
        mensaje: notification.mensaje,
      }),
    });
    return fromRow(rows[0]);
  }

  async list(emergenciaId?: string): Promise<StatusChangeNotification[]> {
    const query = new URLSearchParams({ select: "*", order: "fecha_creacion.desc" });
    if (emergenciaId) query.set("emergencia_id", `eq.${encodeURIComponent(emergenciaId)}`);
    const rows = await this.client.query<NotificationRow[]>("notifications", query.toString());
    return rows.map(fromRow);
  }

  async findById(id: string): Promise<StatusChangeNotification | null> {
    const rows = await this.client.query<NotificationRow[]>(
      "notifications",
      `id=eq.${encodeURIComponent(id)}&select=*`,
    );
    return rows[0] ? fromRow(rows[0]) : null;
  }
}
