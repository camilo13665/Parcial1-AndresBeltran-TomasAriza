import { EmergencyStatus } from "./enums";

/**
 * Evento de notificación relacionado con el cambio de estado de una
 * emergencia. La transmisión real (Webhooks / Realtime) se implementará en
 * una fase posterior; por ahora solo se define la forma del evento.
 */
export interface StatusChangeNotification {
  id: string;
  emergenciaId: string;
  estadoAnterior: EmergencyStatus;
  estadoNuevo: EmergencyStatus;
  mensaje: string;
  fechaCreacion: string;
}
