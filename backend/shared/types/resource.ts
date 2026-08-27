import { City, ResourceStatus, ResourceType } from "./enums";

/**
 * Recurso de un organismo de socorro (Bomberos, Cruz Roja, Defensa Civil,
 * UNGRD, personal médico o de rescate).
 *
 * Las coordenadas geográficas son opcionales por ahora: se activarán cuando
 * se implemente la asignación real y la integración con el microservicio
 * Geospatial & Zone Aggregation.
 */
export interface EmergencyResource {
  id: string;
  tipo: ResourceType;
  organismo: string;
  ciudad: City;
  estado: ResourceStatus;
  latitud?: number;
  longitud?: number;
  fechaCreacion: string;
  fechaActualizacion: string;
}
