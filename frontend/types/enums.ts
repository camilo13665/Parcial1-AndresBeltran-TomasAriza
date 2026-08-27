/** Zonas / ciudades que maneja el sistema tras el terremoto. */
export enum City {
  CHOCO = "CHOCO",
  PEREIRA = "PEREIRA",
  CALI = "CALI",
  MANIZALES = "MANIZALES",
}

/** Tipos de emergencia soportados por el sistema. */
export enum EmergencyType {
  SEARCH_RESCUE_MEDICAL = "SEARCH_RESCUE_MEDICAL",
  SHELTER_TEMPORARY_HOUSING = "SHELTER_TEMPORARY_HOUSING",
  BASIC_SUPPLIES_HUMANITARIAN_AID = "BASIC_SUPPLIES_HUMANITARIAN_AID",
  STRUCTURAL_DAMAGE_ASSESSMENT = "STRUCTURAL_DAMAGE_ASSESSMENT",
}

/** Niveles de prioridad. */
export enum EmergencyPriority {
  CRITICA = "CRITICA",
  ALTA = "ALTA",
  MEDIA = "MEDIA",
  BAJA = "BAJA",
}

/** Flujo de estados de una emergencia. */
export enum EmergencyStatus {
  RECIBIDA = "RECIBIDA",
  VALIDANDO = "VALIDANDO",
  PRIORIZADA = "PRIORIZADA",
  ASIGNADA = "ASIGNADA",
  EN_ATENCION = "EN_ATENCION",
  RESUELTA = "RESUELTA",
  CANCELADA = "CANCELADA",
}

/** Tipos de recurso de organismos de socorro. */
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
