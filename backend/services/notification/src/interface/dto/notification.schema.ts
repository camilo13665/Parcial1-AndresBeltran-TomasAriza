import { z } from "zod";
import { EMERGENCY_STATUSES } from "../../domain/entities/notification.entity";

export const EmergencyStatusEnum = z.enum(EMERGENCY_STATUSES);

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
