import { City, EmergencyPriority, EmergencyStatus, EmergencyType, ResourceStatus, ResourceType } from "@/types";

export const CITY_LABEL: Record<City, string> = {
  [City.CHOCO]: "Chocó",
  [City.PEREIRA]: "Pereira",
  [City.CALI]: "Cali",
  [City.MANIZALES]: "Manizales",
};

export const CITY_LIST: City[] = [City.CHOCO, City.PEREIRA, City.CALI, City.MANIZALES];

/** Coordenadas aproximadas de cada zona (referencia visual, sin proveedor de mapas todavía). */
export const CITY_COORDS: Record<City, { lat: number; lng: number }> = {
  [City.CHOCO]: { lat: 5.6919, lng: -76.6583 },
  [City.PEREIRA]: { lat: 4.8143, lng: -75.6946 },
  [City.CALI]: { lat: 3.4516, lng: -76.532 },
  [City.MANIZALES]: { lat: 5.0689, lng: -75.5174 },
};

interface EmergencyTypeMeta {
  code: "P1" | "P2" | "P3" | "P4";
  label: string;
  shortLabel: string;
  priority: EmergencyPriority;
  description: string;
}

export const EMERGENCY_TYPE_META: Record<EmergencyType, EmergencyTypeMeta> = {
  [EmergencyType.SEARCH_RESCUE_MEDICAL]: {
    code: "P1",
    label: "Búsqueda y Rescate Urbano / Emergencia Médica",
    shortLabel: "Rescate / Médica",
    priority: EmergencyPriority.CRITICA,
    description: "Personas atrapadas, heridas, o riesgo inminente (fuego, fuga de gas).",
  },
  [EmergencyType.SHELTER_TEMPORARY_HOUSING]: {
    code: "P2",
    label: "Albergue y Refugio Temporal",
    shortLabel: "Albergue",
    priority: EmergencyPriority.ALTA,
    description: "Familias damnificadas que requieren refugio temporal.",
  },
  [EmergencyType.BASIC_SUPPLIES_HUMANITARIAN_AID]: {
    code: "P3",
    label: "Suministros Básicos y Asistencia Humanitaria",
    shortLabel: "Suministros",
    priority: EmergencyPriority.MEDIA,
    description: "Agua potable, raciones, kits de primeros auxilios, medicamentos.",
  },
  [EmergencyType.STRUCTURAL_DAMAGE_ASSESSMENT]: {
    code: "P4",
    label: "Evaluación de Daños Estructurales",
    shortLabel: "Daños Estructurales",
    priority: EmergencyPriority.BAJA,
    description: "Agrietamiento, asentamiento o riesgo de colapso sobre vías.",
  },
};

interface PriorityMeta {
  label: string;
  shortLabel: string;
  colorVar: string;
  colorSoftVar: string;
}

export const PRIORITY_META: Record<EmergencyPriority, PriorityMeta> = {
  [EmergencyPriority.CRITICA]: {
    label: "P1 — Crítica",
    shortLabel: "Crítica",
    colorVar: "var(--p1-critica)",
    colorSoftVar: "var(--p1-critica-soft)",
  },
  [EmergencyPriority.ALTA]: {
    label: "P2 — Alta",
    shortLabel: "Alta",
    colorVar: "var(--p2-alta)",
    colorSoftVar: "var(--p2-alta-soft)",
  },
  [EmergencyPriority.MEDIA]: {
    label: "P3 — Media",
    shortLabel: "Media",
    colorVar: "var(--p3-media)",
    colorSoftVar: "var(--p3-media-soft)",
  },
  [EmergencyPriority.BAJA]: {
    label: "P4 — Baja / Preventiva",
    shortLabel: "Baja",
    colorVar: "var(--p4-baja)",
    colorSoftVar: "var(--p4-baja-soft)",
  },
};

export const STATUS_LABEL: Record<EmergencyStatus, string> = {
  [EmergencyStatus.RECIBIDA]: "Recibida",
  [EmergencyStatus.VALIDANDO]: "Validando",
  [EmergencyStatus.PRIORIZADA]: "Priorizada",
  [EmergencyStatus.ASIGNADA]: "Asignada",
  [EmergencyStatus.EN_ATENCION]: "En atención",
  [EmergencyStatus.RESUELTA]: "Resuelta",
  [EmergencyStatus.CANCELADA]: "Cancelada",
};

/** Flujo principal de estados (sin contar CANCELADA, que puede ocurrir en cualquier punto). */
export const STATUS_FLOW: EmergencyStatus[] = [
  EmergencyStatus.RECIBIDA,
  EmergencyStatus.VALIDANDO,
  EmergencyStatus.PRIORIZADA,
  EmergencyStatus.ASIGNADA,
  EmergencyStatus.EN_ATENCION,
  EmergencyStatus.RESUELTA,
];

/** Estado inmediatamente siguiente en el flujo, o null si ya está en un estado final. */
export function nextValidStatus(current: EmergencyStatus): EmergencyStatus | null {
  const idx = STATUS_FLOW.indexOf(current);
  if (idx === -1 || idx === STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[idx + 1];
}

/** CANCELADA es válida desde cualquier estado que no sea ya un estado final. */
export function canCancel(current: EmergencyStatus): boolean {
  return current !== EmergencyStatus.RESUELTA && current !== EmergencyStatus.CANCELADA;
}

export const RESOURCE_TYPE_LABEL: Record<ResourceType, string> = {
  [ResourceType.BOMBEROS]: "Bomberos",
  [ResourceType.CRUZ_ROJA]: "Cruz Roja",
  [ResourceType.DEFENSA_CIVIL]: "Defensa Civil",
  [ResourceType.UNGRD]: "UNGRD",
  [ResourceType.MEDICO]: "Médico",
  [ResourceType.RESCATE]: "Rescate",
};

export const RESOURCE_STATUS_LABEL: Record<ResourceStatus, string> = {
  [ResourceStatus.DISPONIBLE]: "Disponible",
  [ResourceStatus.ASIGNADO]: "Asignado",
  [ResourceStatus.EN_RUTA]: "En ruta",
  [ResourceStatus.OCUPADO]: "Ocupado",
  [ResourceStatus.INACTIVO]: "Inactivo",
};
