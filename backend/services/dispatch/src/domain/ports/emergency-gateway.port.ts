export interface RemoteEmergency {
  id: string;
  tipo: string;
  prioridad: string;
  ciudad: string;
  estado: string;
  latitud: number;
  longitud: number;
}

/**
 * Puerto hacia Intake & Triage. Dispatch no tiene acceso a su base de datos
 * ni importa su lógica interna — la única forma de saber si una emergencia
 * existe, y de avisarle que le asignaron recursos, es a través de este
 * puerto (implementado por un gateway HTTP en infrastructure/gateways).
 */
export interface EmergencyGateway {
  /** Lanza NotFoundError (404) o UpstreamServiceError (502). */
  getEmergency(id: string): Promise<RemoteEmergency>;
  /** Notifica a Intake & Triage que debe avanzar el estado de una emergencia. */
  updateStatus(id: string, estado: string, authorization?: string): Promise<RemoteEmergency>;
}
