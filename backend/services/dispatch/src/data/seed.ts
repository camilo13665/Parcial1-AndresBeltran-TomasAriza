import type { Dispatch, Resource } from "../schemas/dispatch.schema";

export const SEED_RESOURCES: Resource[] = [
  {
    id: "RES-001",
    tipo: "BOMBEROS",
    organismo: "Bomberos Chocó",
    ciudad: "CHOCO",
    estado: "ASIGNADO",
    fechaCreacion: "2026-08-20T06:00:00-05:00",
    fechaActualizacion: "2026-08-20T08:41:00-05:00",
  },
  {
    id: "RES-002",
    tipo: "CRUZ_ROJA",
    organismo: "Cruz Roja Pereira",
    ciudad: "PEREIRA",
    estado: "DISPONIBLE",
    fechaCreacion: "2026-08-20T06:00:00-05:00",
    fechaActualizacion: "2026-08-20T06:00:00-05:00",
  },
  {
    id: "RES-003",
    tipo: "RESCATE",
    organismo: "UNGRD Cali",
    ciudad: "CALI",
    estado: "ASIGNADO",
    fechaCreacion: "2026-08-20T06:00:00-05:00",
    fechaActualizacion: "2026-08-20T09:30:00-05:00",
  },
  {
    id: "RES-004",
    tipo: "MEDICO",
    organismo: "Cruz Roja Manizales",
    ciudad: "MANIZALES",
    estado: "DISPONIBLE",
    fechaCreacion: "2026-08-20T06:00:00-05:00",
    fechaActualizacion: "2026-08-20T06:00:00-05:00",
  },
  {
    id: "RES-005",
    tipo: "DEFENSA_CIVIL",
    organismo: "Defensa Civil Cali",
    ciudad: "CALI",
    estado: "ASIGNADO",
    fechaCreacion: "2026-08-20T06:00:00-05:00",
    fechaActualizacion: "2026-08-20T07:10:00-05:00",
  },
  {
    id: "RES-006",
    tipo: "BOMBEROS",
    organismo: "Bomberos Manizales",
    ciudad: "MANIZALES",
    estado: "ASIGNADO",
    fechaCreacion: "2026-08-20T06:00:00-05:00",
    fechaActualizacion: "2026-08-20T06:00:00-05:00",
  },
  {
    id: "RES-007",
    tipo: "DEFENSA_CIVIL",
    organismo: "Defensa Civil Chocó",
    ciudad: "CHOCO",
    estado: "DISPONIBLE",
    fechaCreacion: "2026-08-20T06:00:00-05:00",
    fechaActualizacion: "2026-08-20T06:00:00-05:00",
  },
  {
    id: "RES-008",
    tipo: "MEDICO",
    organismo: "Cruz Roja Cali",
    ciudad: "CALI",
    estado: "DISPONIBLE",
    fechaCreacion: "2026-08-20T06:00:00-05:00",
    fechaActualizacion: "2026-08-20T06:00:00-05:00",
  },
  {
    id: "RES-009",
    tipo: "RESCATE",
    organismo: "Bomberos Chocó — Rescate",
    ciudad: "CHOCO",
    estado: "DISPONIBLE",
    fechaCreacion: "2026-08-20T06:00:00-05:00",
    fechaActualizacion: "2026-08-20T06:00:00-05:00",
  },
  {
    id: "RES-010",
    tipo: "CRUZ_ROJA",
    organismo: "Cruz Roja Pereira — Unidad 2",
    ciudad: "PEREIRA",
    estado: "DISPONIBLE",
    fechaCreacion: "2026-08-20T06:00:00-05:00",
    fechaActualizacion: "2026-08-20T06:00:00-05:00",
  },
  ...([
    { ciudad: "CHOCO", cantidad: 17 },
    { ciudad: "PEREIRA", cantidad: 18 },
    { ciudad: "CALI", cantidad: 17 },
    { ciudad: "MANIZALES", cantidad: 18 },
  ] as const).flatMap(({ ciudad, cantidad }, ciudadIndex) =>
    Array.from({ length: cantidad }, (_, index) => {
      const numero = 11 + [17, 18, 17, 18].slice(0, ciudadIndex).reduce((total, valor) => total + valor, 0) + index;
      const tipos = ["BOMBEROS", "CRUZ_ROJA", "DEFENSA_CIVIL", "UNGRD", "MEDICO", "RESCATE"] as const;
      const tipo = tipos[(numero - 11) % tipos.length];
      const nombreCiudad = ciudad === "CHOCO" ? "Chocó" : ciudad[0] + ciudad.slice(1).toLowerCase();
      return {
        id: `RES-${String(numero).padStart(3, "0")}`,
        tipo,
        organismo: `${tipo.replace("_", " ")} ${nombreCiudad} ${index + 1}`,
        ciudad,
        estado: "DISPONIBLE" as const,
        fechaCreacion: "2026-08-20T06:00:00-05:00",
        fechaActualizacion: "2026-08-20T06:00:00-05:00",
      };
    }),
  ),
];

export const SEED_DISPATCHES: Dispatch[] = [
  {
    id: "DSP-0001",
    emergenciaId: "EMG-2024-0001",
    recursoIds: ["RES-001"],
    fechaAsignacion: "2026-08-20T08:41:00-05:00",
  },
  {
    id: "DSP-0002",
    emergenciaId: "EMG-2024-0002",
    recursoIds: ["RES-003"],
    fechaAsignacion: "2026-08-20T09:30:00-05:00",
  },
  {
    id: "DSP-0003",
    emergenciaId: "EMG-2024-0007",
    recursoIds: ["RES-005", "RES-006"],
    fechaAsignacion: "2026-08-20T07:10:00-05:00",
  },
];
