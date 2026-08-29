export interface RemoteEmergency {
  id: string;
  ciudad: string;
  prioridad: string;
  latitud: number;
  longitud: number;
}

/**
 * Puerto hacia la fuente de emergencias vigentes. Geospatial no tiene su
 * propio store de emergencias ni accede a la base de datos de Intake &
 * Triage — depende únicamente de esta interfaz, implementada por un gateway
 * HTTP en infrastructure/gateways.
 */
export interface EmergencyFeedPort {
  listEmergencies(): Promise<RemoteEmergency[]>;
}
