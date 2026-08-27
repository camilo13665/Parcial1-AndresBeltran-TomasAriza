/**
 * Enumeraciones compartidas por los cuatro microservicios.
 *
 * Estas enumeraciones reflejan el dominio descrito en el enunciado del
 * proyecto (tipos de emergencia, prioridades, estados, recursos, ciudades).
 * En esta fase solo se definen los tipos: la lógica de negocio (triage,
 * transición de estados, asignación) se implementará en fases posteriores.
 */

/** Zonas / ciudades que maneja el sistema tras el terremoto. */
export enum City {
  CHOCO = "CHOCO",
  PEREIRA = "PEREIRA",
  CALI = "CALI",
  MANIZALES = "MANIZALES",
}

/** Tipos de emergencia soportados por el sistema. */
export enum EmergencyType {
  /** P1 — Búsqueda y Rescate Urbano / Emergencia Médica */
  SEARCH_RESCUE_MEDICAL = "SEARCH_RESCUE_MEDICAL",
  /** P2 — Albergue y Refugio Temporal */
  SHELTER_TEMPORARY_HOUSING = "SHELTER_TEMPORARY_HOUSING",
  /** P3 — Suministros Básicos y Asistencia Humanitaria */
  BASIC_SUPPLIES_HUMANITARIAN_AID = "BASIC_SUPPLIES_HUMANITARIAN_AID",
  /** P4 — Evaluación de Daños Estructurales */
  STRUCTURAL_DAMAGE_ASSESSMENT = "STRUCTURAL_DAMAGE_ASSESSMENT",
}

/** Niveles de prioridad, derivados del tipo de emergencia. */
export enum EmergencyPriority {
  /** P1 */
  CRITICA = "CRITICA",
  /** P2 */
  ALTA = "ALTA",
  /** P3 */
  MEDIA = "MEDIA",
  /** P4 */
  BAJA = "BAJA",
}

/** Mapeo por defecto de tipo de emergencia -> prioridad (referencia, sin lógica activa aún). */
export const DEFAULT_PRIORITY_BY_TYPE: Record<EmergencyType, EmergencyPriority> = {
  [EmergencyType.SEARCH_RESCUE_MEDICAL]: EmergencyPriority.CRITICA,
  [EmergencyType.SHELTER_TEMPORARY_HOUSING]: EmergencyPriority.ALTA,
  [EmergencyType.BASIC_SUPPLIES_HUMANITARIAN_AID]: EmergencyPriority.MEDIA,
  [EmergencyType.STRUCTURAL_DAMAGE_ASSESSMENT]: EmergencyPriority.BAJA,
};

/** Flujo de estados que debe soportar la estructura del sistema. */
export enum EmergencyStatus {
  RECIBIDA = "RECIBIDA",
  VALIDANDO = "VALIDANDO",
  PRIORIZADA = "PRIORIZADA",
  ASIGNADA = "ASIGNADA",
  EN_ATENCION = "EN_ATENCION",
  RESUELTA = "RESUELTA",
  CANCELADA = "CANCELADA",
}

/** Organismos de socorro que participan en el sistema. */
export enum Organism {
  CRUZ_ROJA = "CRUZ_ROJA",
  BOMBEROS = "BOMBEROS",
  DEFENSA_CIVIL = "DEFENSA_CIVIL",
  UNGRD = "UNGRD",
}

/** Tipos de recurso gestionables por Dispatch & Resource Assignment. */
export enum ResourceType {
  BOMBEROS = "BOMBEROS",
  CRUZ_ROJA = "CRUZ_ROJA",
  DEFENSA_CIVIL = "DEFENSA_CIVIL",
  UNGRD = "UNGRD",
  MEDICO = "MEDICO",
  RESCATE = "RESCATE",
}

/** Estados posibles de un recurso. */
export enum ResourceStatus {
  DISPONIBLE = "DISPONIBLE",
  ASIGNADO = "ASIGNADO",
  EN_RUTA = "EN_RUTA",
  OCUPADO = "OCUPADO",
  INACTIVO = "INACTIVO",
}
