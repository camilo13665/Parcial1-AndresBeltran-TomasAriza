/** Fuente única de verdad del enum — el DTO de interface/dto lo deriva de aquí. */
export const EMERGENCY_STATUSES = [
  "RECIBIDA",
  "VALIDANDO",
  "PRIORIZADA",
  "ASIGNADA",
  "EN_ATENCION",
  "RESUELTA",
  "CANCELADA",
] as const;
export type EmergencyStatus = (typeof EMERGENCY_STATUSES)[number];

export interface NotificationProps {
  id: string;
  emergenciaId: string;
  estadoAnterior: EmergencyStatus;
  estadoNuevo: EmergencyStatus;
  mensaje: string;
  fechaCreacion: string;
}

export interface NewNotificationInput {
  emergenciaId: string;
  estadoAnterior: EmergencyStatus;
  estadoNuevo: EmergencyStatus;
  mensaje?: string;
}

/** Entidad de dominio: encapsula la regla "sin mensaje explícito, se genera uno por defecto". */
export class StatusChangeNotification {
  readonly id: string;
  readonly emergenciaId: string;
  readonly estadoAnterior: EmergencyStatus;
  readonly estadoNuevo: EmergencyStatus;
  readonly mensaje: string;
  readonly fechaCreacion: string;

  constructor(props: NotificationProps) {
    this.id = props.id;
    this.emergenciaId = props.emergenciaId;
    this.estadoAnterior = props.estadoAnterior;
    this.estadoNuevo = props.estadoNuevo;
    this.mensaje = props.mensaje;
    this.fechaCreacion = props.fechaCreacion;
  }

  static create(input: NewNotificationInput, id: string, timestamp: string): StatusChangeNotification {
    return new StatusChangeNotification({
      id,
      emergenciaId: input.emergenciaId,
      estadoAnterior: input.estadoAnterior,
      estadoNuevo: input.estadoNuevo,
      mensaje: input.mensaje ?? `El estado cambió de ${input.estadoAnterior} a ${input.estadoNuevo}.`,
      fechaCreacion: timestamp,
    });
  }
}
