import { Dispatch } from "../../domain/entities/dispatch.entity";
import { City, Resource } from "../../domain/entities/resource.entity";

/** Centro aproximado de cada ciudad — mismos puntos que usa Geospatial para sus zonas. */
const CITY_CENTERS: Record<City, { latitud: number; longitud: number }> = {
  CHOCO: { latitud: 5.6919, longitud: -76.6583 },
  PEREIRA: { latitud: 4.8143, longitud: -75.6946 },
  CALI: { latitud: 3.4516, longitud: -76.532 },
  MANIZALES: { latitud: 5.0689, longitud: -75.5174 },
};

/** Dispersa un punto alrededor del centro de la ciudad, en un radio de 1-6 km (determinístico). */
function jitterAroundCity(ciudad: City, seed: number): { latitud: number; longitud: number } {
  const center = CITY_CENTERS[ciudad];
  const angleRad = ((seed * 37) % 360) * (Math.PI / 180);
  const radiusKm = 1 + (seed % 8) * 0.8;
  const dLat = (radiusKm / 111) * Math.cos(angleRad);
  const dLng = (radiusKm / (111 * Math.cos((center.latitud * Math.PI) / 180))) * Math.sin(angleRad);
  return { latitud: center.latitud + dLat, longitud: center.longitud + dLng };
}

const FIXED_RESOURCES: Resource[] = [
  new Resource({
    id: "RES-001",
    tipo: "BOMBEROS",
    organismo: "Bomberos Chocó",
    ciudad: "CHOCO",
    estado: "ASIGNADO",
    ...jitterAroundCity("CHOCO", 1),
    fechaCreacion: "2026-08-20T06:00:00-05:00",
    fechaActualizacion: "2026-08-20T08:41:00-05:00",
  }),
  new Resource({
    id: "RES-002",
    tipo: "CRUZ_ROJA",
    organismo: "Cruz Roja Pereira",
    ciudad: "PEREIRA",
    estado: "DISPONIBLE",
    ...jitterAroundCity("PEREIRA", 2),
    fechaCreacion: "2026-08-20T06:00:00-05:00",
    fechaActualizacion: "2026-08-20T06:00:00-05:00",
  }),
  new Resource({
    id: "RES-003",
    tipo: "RESCATE",
    organismo: "UNGRD Cali",
    ciudad: "CALI",
    estado: "ASIGNADO",
    ...jitterAroundCity("CALI", 3),
    fechaCreacion: "2026-08-20T06:00:00-05:00",
    fechaActualizacion: "2026-08-20T09:30:00-05:00",
  }),
  new Resource({
    id: "RES-004",
    tipo: "MEDICO",
    organismo: "Cruz Roja Manizales",
    ciudad: "MANIZALES",
    estado: "DISPONIBLE",
    ...jitterAroundCity("MANIZALES", 4),
    fechaCreacion: "2026-08-20T06:00:00-05:00",
    fechaActualizacion: "2026-08-20T06:00:00-05:00",
  }),
  new Resource({
    id: "RES-005",
    tipo: "DEFENSA_CIVIL",
    organismo: "Defensa Civil Cali",
    ciudad: "CALI",
    estado: "ASIGNADO",
    ...jitterAroundCity("CALI", 5),
    fechaCreacion: "2026-08-20T06:00:00-05:00",
    fechaActualizacion: "2026-08-20T07:10:00-05:00",
  }),
  new Resource({
    id: "RES-006",
    tipo: "BOMBEROS",
    organismo: "Bomberos Manizales",
    ciudad: "MANIZALES",
    estado: "ASIGNADO",
    ...jitterAroundCity("MANIZALES", 6),
    fechaCreacion: "2026-08-20T06:00:00-05:00",
    fechaActualizacion: "2026-08-20T06:00:00-05:00",
  }),
  new Resource({
    id: "RES-007",
    tipo: "DEFENSA_CIVIL",
    organismo: "Defensa Civil Chocó",
    ciudad: "CHOCO",
    estado: "DISPONIBLE",
    ...jitterAroundCity("CHOCO", 7),
    fechaCreacion: "2026-08-20T06:00:00-05:00",
    fechaActualizacion: "2026-08-20T06:00:00-05:00",
  }),
  new Resource({
    id: "RES-008",
    tipo: "MEDICO",
    organismo: "Cruz Roja Cali",
    ciudad: "CALI",
    estado: "DISPONIBLE",
    ...jitterAroundCity("CALI", 8),
    fechaCreacion: "2026-08-20T06:00:00-05:00",
    fechaActualizacion: "2026-08-20T06:00:00-05:00",
  }),
  new Resource({
    id: "RES-009",
    tipo: "RESCATE",
    organismo: "Bomberos Chocó — Rescate",
    ciudad: "CHOCO",
    estado: "DISPONIBLE",
    ...jitterAroundCity("CHOCO", 9),
    fechaCreacion: "2026-08-20T06:00:00-05:00",
    fechaActualizacion: "2026-08-20T06:00:00-05:00",
  }),
  new Resource({
    id: "RES-010",
    tipo: "CRUZ_ROJA",
    organismo: "Cruz Roja Pereira — Unidad 2",
    ciudad: "PEREIRA",
    estado: "DISPONIBLE",
    ...jitterAroundCity("PEREIRA", 10),
    fechaCreacion: "2026-08-20T06:00:00-05:00",
    fechaActualizacion: "2026-08-20T06:00:00-05:00",
  }),
];

const GENERATED_RESOURCES: Resource[] = (
  [
    { ciudad: "CHOCO", cantidad: 17 },
    { ciudad: "PEREIRA", cantidad: 18 },
    { ciudad: "CALI", cantidad: 17 },
    { ciudad: "MANIZALES", cantidad: 18 },
  ] as const
).flatMap(({ ciudad, cantidad }, ciudadIndex) =>
  Array.from({ length: cantidad }, (_, index) => {
    const numero = 11 + [17, 18, 17, 18].slice(0, ciudadIndex).reduce((total, valor) => total + valor, 0) + index;
    const tipos = ["BOMBEROS", "CRUZ_ROJA", "DEFENSA_CIVIL", "UNGRD", "MEDICO", "RESCATE"] as const;
    const tipo = tipos[(numero - 11) % tipos.length];
    const nombreCiudad = ciudad === "CHOCO" ? "Chocó" : ciudad[0] + ciudad.slice(1).toLowerCase();
    return new Resource({
      id: `RES-${String(numero).padStart(3, "0")}`,
      tipo,
      organismo: `${tipo.replace("_", " ")} ${nombreCiudad} ${index + 1}`,
      ciudad,
      estado: "DISPONIBLE",
      ...jitterAroundCity(ciudad, numero),
      fechaCreacion: "2026-08-20T06:00:00-05:00",
      fechaActualizacion: "2026-08-20T06:00:00-05:00",
    });
  }),
);

export const SEED_RESOURCES: Resource[] = [...FIXED_RESOURCES, ...GENERATED_RESOURCES];

export const SEED_DISPATCHES: Dispatch[] = [
  new Dispatch({
    id: "DSP-0001",
    emergenciaId: "EMG-2024-0001",
    recursoIds: ["RES-001"],
    fechaAsignacion: "2026-08-20T08:41:00-05:00",
  }),
  new Dispatch({
    id: "DSP-0002",
    emergenciaId: "EMG-2024-0002",
    recursoIds: ["RES-003"],
    fechaAsignacion: "2026-08-20T09:30:00-05:00",
  }),
  new Dispatch({
    id: "DSP-0003",
    emergenciaId: "EMG-2024-0007",
    recursoIds: ["RES-005", "RES-006"],
    fechaAsignacion: "2026-08-20T07:10:00-05:00",
  }),
];
