import { supabaseQuery } from "../db/supabase";
import { CreateNotificationInput, StatusChangeNotification } from "../schemas/notification.schema";
import { NotFoundError } from "../errors";

type NotificationRow = { id: string; emergencia_id: string; estado_anterior: string; estado_nuevo: string; mensaje: string; fecha_creacion: string };
function fromRow(row: NotificationRow): StatusChangeNotification {
  return { id: row.id, emergenciaId: row.emergencia_id, estadoAnterior: row.estado_anterior as StatusChangeNotification["estadoAnterior"], estadoNuevo: row.estado_nuevo as StatusChangeNotification["estadoNuevo"], mensaje: row.mensaje, fechaCreacion: row.fecha_creacion };
}

export const notificationService = {
  async create(input: CreateNotificationInput): Promise<StatusChangeNotification> {
    const rows = await supabaseQuery<NotificationRow[]>("notifications", "", { method: "POST", body: JSON.stringify({ emergencia_id: input.emergenciaId, estado_anterior: input.estadoAnterior, estado_nuevo: input.estadoNuevo, mensaje: input.mensaje ?? `El estado cambió de ${input.estadoAnterior} a ${input.estadoNuevo}.` }) });
    return fromRow(rows[0]);
  },
  async list(emergenciaId?: string): Promise<StatusChangeNotification[]> {
    const query = new URLSearchParams({ select: "*", order: "fecha_creacion.desc" });
    if (emergenciaId) query.set("emergencia_id", `eq.${encodeURIComponent(emergenciaId)}`);
    const rows = await supabaseQuery<NotificationRow[]>("notifications", query.toString());
    return rows.map(fromRow);
  },
  async getById(id: string): Promise<StatusChangeNotification> {
    const rows = await supabaseQuery<NotificationRow[]>("notifications", `id=eq.${encodeURIComponent(id)}&select=*`);
    if (!rows[0]) throw new NotFoundError(`No existe una notificación con id ${id}`);
    return fromRow(rows[0]);
  },
};
