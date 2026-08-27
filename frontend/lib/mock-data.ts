import { City, Emergency, EmergencyPriority, EmergencyStatus, EmergencyType, EmergencyResource, ResourceStatus, ResourceType } from "@/types";
import { CITY_COORDS } from "./constants";

/**
 * Datos mock — NO conectados a base de datos.
 * Sirven únicamente para que el Frontend no aparezca vacío mientras se
 * implementa la lógica real de los microservicios.
 */

function jitter(base: number, spread = 0.06): number {
  return base + (Math.random() - 0.5) * spread;
}

export const MOCK_EMERGENCIES: Emergency[] = [
  {
    id: "EMG-2024-0001",
    tipo: EmergencyType.SEARCH_RESCUE_MEDICAL,
    prioridad: EmergencyPriority.CRITICA,
    ciudad: City.CHOCO,
    descripcion: "Edificio residencial colapsado parcialmente, se escuchan personas atrapadas en el segundo piso.",
    latitud: jitter(CITY_COORDS[City.CHOCO].lat),
    longitud: jitter(CITY_COORDS[City.CHOCO].lng),
    estado: EmergencyStatus.EN_ATENCION,
    fechaCreacion: "2026-08-20T08:12:00-05:00",
    fechaActualizacion: "2026-08-20T08:41:00-05:00",
    datosEspecificos: {
      personasAtrapadasOHeridas: 4,
      riesgoInminente: true,
      fugaDeGas: true,
      fuego: false,
      otrosRiesgos: "Estructura inestable, riesgo de colapso total.",
    },
  },
  {
    id: "EMG-2024-0002",
    tipo: EmergencyType.SHELTER_TEMPORARY_HOUSING,
    prioridad: EmergencyPriority.ALTA,
    ciudad: City.PEREIRA,
    descripcion: "Familia de 6 personas sin vivienda habitable tras el sismo, requiere albergue temporal.",
    latitud: jitter(CITY_COORDS[City.PEREIRA].lat),
    longitud: jitter(CITY_COORDS[City.PEREIRA].lng),
    estado: EmergencyStatus.ASIGNADA,
    fechaCreacion: "2026-08-20T09:03:00-05:00",
    fechaActualizacion: "2026-08-20T09:30:00-05:00",
    datosEspecificos: {
      numeroAdultos: 2,
      numeroNinos: 3,
      numeroAdultosMayores: 1,
      requerimientosAccesibilidad: "Adulto mayor con movilidad reducida.",
      estadoHabitabilidadVivienda: "NO_HABITABLE",
    },
  },
  {
    id: "EMG-2024-0003",
    tipo: EmergencyType.BASIC_SUPPLIES_HUMANITARIAN_AID,
    prioridad: EmergencyPriority.MEDIA,
    ciudad: City.CALI,
    descripcion: "Comunidad de 40 familias sin acceso a agua potable desde hace 18 horas.",
    latitud: jitter(CITY_COORDS[City.CALI].lat),
    longitud: jitter(CITY_COORDS[City.CALI].lng),
    estado: EmergencyStatus.PRIORIZADA,
    fechaCreacion: "2026-08-20T07:45:00-05:00",
    fechaActualizacion: "2026-08-20T08:00:00-05:00",
    datosEspecificos: {
      categoriaInsumo: "AGUA_POTABLE",
      cantidadRequerida: 400,
    },
  },
  {
    id: "EMG-2024-0004",
    tipo: EmergencyType.STRUCTURAL_DAMAGE_ASSESSMENT,
    prioridad: EmergencyPriority.BAJA,
    ciudad: City.MANIZALES,
    descripcion: "Vivienda de dos pisos presenta agrietamiento visible en muro perimetral tras el sismo.",
    latitud: jitter(CITY_COORDS[City.MANIZALES].lat),
    longitud: jitter(CITY_COORDS[City.MANIZALES].lng),
    estado: EmergencyStatus.RECIBIDA,
    fechaCreacion: "2026-08-20T10:15:00-05:00",
    fechaActualizacion: "2026-08-20T10:15:00-05:00",
    datosEspecificos: {
      tipoEdificacion: "Vivienda unifamiliar, 2 niveles",
      nivelAgrietamiento: "MODERADO",
      asentamiento: false,
      riesgoColapsoSobreVias: false,
    },
  },
  {
    id: "EMG-2024-0005",
    tipo: EmergencyType.SEARCH_RESCUE_MEDICAL,
    prioridad: EmergencyPriority.CRITICA,
    ciudad: City.CALI,
    descripcion: "Persona herida bajo escombros tras derrumbe de muro de contención.",
    latitud: jitter(CITY_COORDS[City.CALI].lat),
    longitud: jitter(CITY_COORDS[City.CALI].lng),
    estado: EmergencyStatus.VALIDANDO,
    fechaCreacion: "2026-08-20T10:50:00-05:00",
    fechaActualizacion: "2026-08-20T10:52:00-05:00",
    datosEspecificos: {
      personasAtrapadasOHeridas: 1,
      riesgoInminente: true,
      fugaDeGas: false,
      fuego: false,
    },
  },
  {
    id: "EMG-2024-0006",
    tipo: EmergencyType.SHELTER_TEMPORARY_HOUSING,
    prioridad: EmergencyPriority.ALTA,
    ciudad: City.CHOCO,
    descripcion: "Grupo de 12 personas desplazadas por inundación asociada, requiere albergue.",
    latitud: jitter(CITY_COORDS[City.CHOCO].lat),
    longitud: jitter(CITY_COORDS[City.CHOCO].lng),
    estado: EmergencyStatus.RESUELTA,
    fechaCreacion: "2026-08-19T22:10:00-05:00",
    fechaActualizacion: "2026-08-20T06:00:00-05:00",
    datosEspecificos: {
      numeroAdultos: 7,
      numeroNinos: 4,
      numeroAdultosMayores: 1,
      estadoHabitabilidadVivienda: "NO_HABITABLE",
    },
  },
  {
    id: "EMG-2024-0007",
    tipo: EmergencyType.BASIC_SUPPLIES_HUMANITARIAN_AID,
    prioridad: EmergencyPriority.MEDIA,
    ciudad: City.MANIZALES,
    descripcion: "Solicitud de kits de primeros auxilios para puesto de atención comunitario.",
    latitud: jitter(CITY_COORDS[City.MANIZALES].lat),
    longitud: jitter(CITY_COORDS[City.MANIZALES].lng),
    estado: EmergencyStatus.ASIGNADA,
    fechaCreacion: "2026-08-20T06:30:00-05:00",
    fechaActualizacion: "2026-08-20T07:10:00-05:00",
    datosEspecificos: {
      categoriaInsumo: "KIT_PRIMEROS_AUXILIOS",
      cantidadRequerida: 25,
    },
  },
  {
    id: "EMG-2024-0008",
    tipo: EmergencyType.STRUCTURAL_DAMAGE_ASSESSMENT,
    prioridad: EmergencyPriority.BAJA,
    ciudad: City.PEREIRA,
    descripcion: "Puente peatonal con posible riesgo de colapso, se solicita evaluación técnica.",
    latitud: jitter(CITY_COORDS[City.PEREIRA].lat),
    longitud: jitter(CITY_COORDS[City.PEREIRA].lng),
    estado: EmergencyStatus.CANCELADA,
    fechaCreacion: "2026-08-19T19:00:00-05:00",
    fechaActualizacion: "2026-08-19T20:00:00-05:00",
    datosEspecificos: {
      tipoEdificacion: "Puente peatonal",
      nivelAgrietamiento: "LEVE",
      asentamiento: false,
      riesgoColapsoSobreVias: true,
    },
  },
];

export const MOCK_RESOURCES: EmergencyResource[] = [
  { id: "RES-001", tipo: ResourceType.BOMBEROS, organismo: "Bomberos Chocó", ciudad: City.CHOCO, estado: ResourceStatus.EN_RUTA },
  { id: "RES-002", tipo: ResourceType.CRUZ_ROJA, organismo: "Cruz Roja Pereira", ciudad: City.PEREIRA, estado: ResourceStatus.DISPONIBLE },
  { id: "RES-003", tipo: ResourceType.RESCATE, organismo: "UNGRD Cali", ciudad: City.CALI, estado: ResourceStatus.ASIGNADO },
  { id: "RES-004", tipo: ResourceType.MEDICO, organismo: "Cruz Roja Manizales", ciudad: City.MANIZALES, estado: ResourceStatus.DISPONIBLE },
  { id: "RES-005", tipo: ResourceType.DEFENSA_CIVIL, organismo: "Defensa Civil Cali", ciudad: City.CALI, estado: ResourceStatus.OCUPADO },
  { id: "RES-006", tipo: ResourceType.BOMBEROS, organismo: "Bomberos Manizales", ciudad: City.MANIZALES, estado: ResourceStatus.DISPONIBLE },
];

export function getEmergencyById(id: string): Emergency | undefined {
  return MOCK_EMERGENCIES.find((e) => e.id === id);
}
