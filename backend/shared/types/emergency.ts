import { City, EmergencyPriority, EmergencyStatus, EmergencyType } from "./enums";

/**
 * Datos específicos por tipo de emergencia.
 *
 * Estos campos NO son obligatoriamente visibles todos a la vez en el
 * Frontend: el formulario de reporte debe renderizar dinámicamente solo el
 * bloque correspondiente al tipo seleccionado.
 */

/** P1 — Búsqueda y Rescate Urbano / Emergencia Médica */
export interface SearchRescueMedicalData {
  personasAtrapadasOHeridas: number;
  riesgoInminente: boolean;
  fugaDeGas: boolean;
  fuego: boolean;
  otrosRiesgos?: string;
}

/** P2 — Albergue y Refugio Temporal */
export interface ShelterTemporaryHousingData {
  numeroAdultos: number;
  numeroNinos: number;
  numeroAdultosMayores: number;
  requerimientosAccesibilidad?: string;
  estadoHabitabilidadVivienda: "HABITABLE" | "NO_HABITABLE" | "PARCIALMENTE_HABITABLE";
}

/** P3 — Suministros Básicos y Asistencia Humanitaria */
export interface BasicSuppliesHumanitarianAidData {
  categoriaInsumo: "AGUA_POTABLE" | "RACIONES" | "KIT_PRIMEROS_AUXILIOS" | "MEDICAMENTOS_CRONICOS";
  cantidadRequerida: number;
}

/** P4 — Evaluación de Daños Estructurales */
export interface StructuralDamageAssessmentData {
  tipoEdificacion: string;
  nivelAgrietamiento: "LEVE" | "MODERADO" | "SEVERO";
  asentamiento: boolean;
  evidenciaFotograficaUrls?: string[];
  riesgoColapsoSobreVias: boolean;
}

/** Unión discriminada de los datos específicos según el tipo de emergencia. */
export type EmergencyTypeSpecificData =
  | { type: EmergencyType.SEARCH_RESCUE_MEDICAL; data: SearchRescueMedicalData }
  | { type: EmergencyType.SHELTER_TEMPORARY_HOUSING; data: ShelterTemporaryHousingData }
  | { type: EmergencyType.BASIC_SUPPLIES_HUMANITARIAN_AID; data: BasicSuppliesHumanitarianAidData }
  | { type: EmergencyType.STRUCTURAL_DAMAGE_ASSESSMENT; data: StructuralDamageAssessmentData };

/**
 * Entidad principal de una emergencia.
 *
 * En esta fase se define únicamente la forma de los datos; la persistencia
 * (PostgreSQL / Supabase / PostGIS) se implementará en fases posteriores.
 */
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
  datosEspecificos: EmergencyTypeSpecificData["data"];
}

/** Payload esperado para crear una nueva emergencia (fase futura). */
export type CreateEmergencyInput = Omit<
  Emergency,
  "id" | "prioridad" | "estado" | "fechaCreacion" | "fechaActualizacion"
>;
