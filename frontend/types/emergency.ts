import { City, EmergencyPriority, EmergencyStatus, EmergencyType, ResourceStatus, ResourceType } from "./enums";

/**
 * Datos específicos por tipo de emergencia. El formulario de reporte
 * (`/reportar`) debe renderizar dinámicamente solo el bloque que
 * corresponde al tipo seleccionado — no todos los campos a la vez.
 */
export interface SearchRescueMedicalData {
  personasAtrapadasOHeridas: number;
  riesgoInminente: boolean;
  fugaDeGas: boolean;
  fuego: boolean;
  otrosRiesgos?: string;
}

export interface ShelterTemporaryHousingData {
  numeroAdultos: number;
  numeroNinos: number;
  numeroAdultosMayores: number;
  requerimientosAccesibilidad?: string;
  estadoHabitabilidadVivienda: "HABITABLE" | "NO_HABITABLE" | "PARCIALMENTE_HABITABLE";
}

export interface BasicSuppliesHumanitarianAidData {
  categoriaInsumo: "AGUA_POTABLE" | "RACIONES" | "KIT_PRIMEROS_AUXILIOS" | "MEDICAMENTOS_CRONICOS";
  cantidadRequerida: number;
}

export interface StructuralDamageAssessmentData {
  tipoEdificacion: string;
  nivelAgrietamiento: "LEVE" | "MODERADO" | "SEVERO";
  asentamiento: boolean;
  evidenciaFotograficaUrls?: string[];
  riesgoColapsoSobreVias: boolean;
}

export type EmergencyTypeSpecificData =
  | SearchRescueMedicalData
  | ShelterTemporaryHousingData
  | BasicSuppliesHumanitarianAidData
  | StructuralDamageAssessmentData;

/** Entidad principal de una emergencia (fase 1: solo tipos + datos mock). */
export interface Emergency {
  id: string;
  tipo: EmergencyType;
  prioridad: EmergencyPriority;
  ciudad: City;
  descripcion: string;
  latitud: number;
  longitud: number;
  estado: EmergencyStatus;
  fechaCreacion: string;
  fechaActualizacion: string;
  datosEspecificos: EmergencyTypeSpecificData;
}

/** Recurso de un organismo de socorro. */
export interface EmergencyResource {
  id: string;
  tipo: ResourceType;
  organismo: string;
  ciudad: City;
  estado: ResourceStatus;
}
