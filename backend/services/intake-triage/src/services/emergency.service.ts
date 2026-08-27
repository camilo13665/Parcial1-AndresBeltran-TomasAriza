import { supabaseQuery } from "../db/supabase";
import { CreateEmergencyInput, Emergency, EmergencyStatus, PRIORITY_BY_TYPE, STATUS_FLOW } from "../schemas/emergency.schema";
import { SEED_EMERGENCIES } from "../data/seed";
import { ConflictError, NotFoundError } from "../errors";

type EmergencyRow = Omit<Emergency, "datosEspecificos" | "fechaCreacion" | "fechaActualizacion"> & {
  datos_especificos: Record<string, unknown>;
  fecha_creacion: string;
  fecha_actualizacion: string;
};

function fromRow(row: EmergencyRow): Emergency {
  return {
    ...row,
    datosEspecificos: row.datos_especificos,
    fechaCreacion: row.fecha_creacion,
    fechaActualizacion: row.fecha_actualizacion,
  } as unknown as Emergency;
}

function toRow(emergency: Emergency) {
  return {
    id: emergency.id,
    tipo: emergency.tipo,
    prioridad: emergency.prioridad,
    ciudad: emergency.ciudad,
    descripcion: emergency.descripcion,
    latitud: emergency.latitud,
    longitud: emergency.longitud,
    estado: emergency.estado,
    datos_especificos: emergency.datosEspecificos,
    fecha_creacion: emergency.fechaCreacion,
    fecha_actualizacion: emergency.fechaActualizacion,
  };
}

async function ensureSeeded() {
  await supabaseQuery<EmergencyRow[]>("emergencies", "on_conflict=id", {
    method: "POST",
    headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
    body: JSON.stringify(SEED_EMERGENCIES.map(toRow)),
  });
}

export interface ListFilters { ciudad?: string; prioridad?: string; estado?: string; }

export const emergencyService = {
  async create(input: CreateEmergencyInput): Promise<Emergency> {
    const count = await supabaseQuery<{ count: number }[]>("emergencies", "select=id", { headers: { Prefer: "count=exact" } });
    const sequence = (count.length ?? 0) + 1;
    const timestamp = new Date().toISOString();
    const emergency: Emergency = {
      id: `EMG-${new Date().getFullYear()}-${String(sequence).padStart(4, "0")}`,
      tipo: input.tipo,
      prioridad: PRIORITY_BY_TYPE[input.tipo],
      ciudad: input.ciudad,
      descripcion: input.descripcion,
      latitud: input.latitud,
      longitud: input.longitud,
      estado: "RECIBIDA",
      fechaCreacion: timestamp,
      fechaActualizacion: timestamp,
      datosEspecificos: input.datosEspecificos,
    };
    const rows = await supabaseQuery<EmergencyRow[]>("emergencies", "", { method: "POST", body: JSON.stringify(toRow(emergency)) });
    return fromRow(rows[0]);
  },

  async list(filters: ListFilters): Promise<Emergency[]> {
    await ensureSeeded();
    const params = new URLSearchParams({ select: "*", order: "fecha_creacion.desc" });
    if (filters.ciudad) params.set("ciudad", `eq.${filters.ciudad}`);
    if (filters.prioridad) params.set("prioridad", `eq.${filters.prioridad}`);
    if (filters.estado) params.set("estado", `eq.${filters.estado}`);
    const rows = await supabaseQuery<EmergencyRow[]>("emergencies", params.toString());
    return rows.map(fromRow);
  },

  async getById(id: string): Promise<Emergency> {
    await ensureSeeded();
    const rows = await supabaseQuery<EmergencyRow[]>("emergencies", `id=eq.${encodeURIComponent(id)}&select=*`);
    if (!rows[0]) throw new NotFoundError(`No existe una emergencia con id ${id}`);
    return fromRow(rows[0]);
  },

  async updateStatus(id: string, nuevoEstado: EmergencyStatus): Promise<Emergency> {
    const emergency = await this.getById(id);
    if (emergency.estado === "RESUELTA" || emergency.estado === "CANCELADA") throw new ConflictError(`La emergencia ${id} ya está en estado final (${emergency.estado})`);
    const currentIndex = STATUS_FLOW.indexOf(emergency.estado);
    const nextIndex = STATUS_FLOW.indexOf(nuevoEstado);
    if (nuevoEstado !== "CANCELADA" && (nextIndex === -1 || nextIndex !== currentIndex + 1)) {
      throw new ConflictError(`Transición inválida: ${emergency.estado} -> ${nuevoEstado}. El siguiente estado válido es ${STATUS_FLOW[currentIndex + 1] ?? "ninguno"}.`);
    }
    const rows = await supabaseQuery<EmergencyRow[]>("emergencies", `id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ estado: nuevoEstado, fecha_actualizacion: new Date().toISOString() }),
    });
    return fromRow(rows[0]);
  },

  async stats() {
    const emergencies = await this.list({});
    return {
      total: emergencies.length,
      porPrioridad: Object.fromEntries(["CRITICA", "ALTA", "MEDIA", "BAJA"].map((p) => [p, emergencies.filter((e) => e.prioridad === p).length])),
      porCiudad: Object.fromEntries(["CHOCO", "PEREIRA", "CALI", "MANIZALES"].map((c) => [c, emergencies.filter((e) => e.ciudad === c).length])),
    };
  },
};
