import { z } from "zod";

export const EmergencyStatusEnum = z.enum([
  "RECIBIDA",
  "VALIDANDO",
  "PRIORIZADA",
  "ASIGNADA",
  "EN_ATENCION",
  "RESUELTA",
  "CANCELADA",
]);
export type EmergencyStatus = z.infer<typeof EmergencyStatusEnum>;

export interface StatusChangeNotification {
  id: string;
  emergenciaId: string;
  estadoAnterior: EmergencyStatus;
  estadoNuevo: EmergencyStatus;
  mensaje: string;
  fechaCreacion: string;
}

export const CreateNotificationSchema = z.object({
  emergenciaId: z.string().min(1),
  estadoAnterior: EmergencyStatusEnum,
  estadoNuevo: EmergencyStatusEnum,
  mensaje: z.string().min(1).max(500).optional(),
});
export type CreateNotificationInput = z.infer<typeof CreateNotificationSchema>;

export const ListNotificationsQuerySchema = z.object({
  emergenciaId: z.string().optional(),
});
