import { EmergencyStatus } from "./enums";

/**
 * Registro de despacho: la asociación entre una emergencia y los recursos
 * asignados para atenderla. La lógica de asignación real se implementará en
 * una fase posterior; por ahora solo se define la forma de los datos.
 */
export interface Dispatch {
  id: string;
  emergenciaId: string;
  recursoIds: string[];
  estado: EmergencyStatus;
  fechaAsignacion: string;
  fechaActualizacion: string;
  notas?: string;
}
