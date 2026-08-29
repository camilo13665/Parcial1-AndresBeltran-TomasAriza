import { Emergency, EmergencyProps, EmergencyStatus } from "../../domain/entities/emergency.entity";
import { EmergencyRepository, ListEmergenciesFilters } from "../../domain/repositories/emergency.repository";
import { PostgrestClient } from "./postgrest-client";
import { SEED_EMERGENCIES } from "./seed-data";

type EmergencyRow = Omit<EmergencyProps, "datosEspecificos" | "fechaCreacion" | "fechaActualizacion"> & {
  datos_especificos: unknown;
  fecha_creacion: string;
  fecha_actualizacion: string;
};

/**
 * Columnas explícitas para todo select/representation: `ubicacion` (geography,
 * agregada en 002_rls_and_postgis.sql) es un espejo interno para consultas
 * espaciales, no un campo del contrato REST — sin este `select`, PostgREST
 * la devuelve igual que cualquier otra columna (como WKB en crudo).
 */
const SELECT_COLUMNS =
  "id,tipo,prioridad,ciudad,descripcion,latitud,longitud,estado,datos_especificos,fecha_creacion,fecha_actualizacion";

function fromRow(row: EmergencyRow): Emergency {
  return new Emergency({
    id: row.id,
    tipo: row.tipo,
    prioridad: row.prioridad,
    ciudad: row.ciudad,
    descripcion: row.descripcion,
    latitud: row.latitud,
    longitud: row.longitud,
    estado: row.estado,
    datosEspecificos: row.datos_especificos,
    fechaCreacion: row.fecha_creacion,
    fechaActualizacion: row.fecha_actualizacion,
  });
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

/** Implementación concreta del puerto EmergencyRepository sobre Supabase/PostgREST. */
export class SupabaseEmergencyRepository implements EmergencyRepository {
  constructor(private readonly client: PostgrestClient) {}

  private async ensureSeeded(): Promise<void> {
    await this.client.query<EmergencyRow[]>("emergencies", "on_conflict=id", {
      method: "POST",
      headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
      body: JSON.stringify(SEED_EMERGENCIES.map(toRow)),
    });
  }

  async count(): Promise<number> {
    const rows = await this.client.query<{ id: string }[]>("emergencies", "select=id", {
      headers: { Prefer: "count=exact" },
    });
    return rows?.length ?? 0;
  }

  async create(emergency: Emergency): Promise<Emergency> {
    const rows = await this.client.query<EmergencyRow[]>("emergencies", `select=${SELECT_COLUMNS}`, {
      method: "POST",
      body: JSON.stringify(toRow(emergency)),
    });
    return fromRow(rows[0]);
  }

  async list(filters: ListEmergenciesFilters): Promise<Emergency[]> {
    await this.ensureSeeded();
    const params = new URLSearchParams({ select: SELECT_COLUMNS, order: "fecha_creacion.desc" });
    if (filters.ciudad) params.set("ciudad", `eq.${filters.ciudad}`);
    if (filters.prioridad) params.set("prioridad", `eq.${filters.prioridad}`);
    if (filters.estado) params.set("estado", `eq.${filters.estado}`);
    const rows = await this.client.query<EmergencyRow[]>("emergencies", params.toString());
    return rows.map(fromRow);
  }

  async findById(id: string): Promise<Emergency | null> {
    await this.ensureSeeded();
    const rows = await this.client.query<EmergencyRow[]>(
      "emergencies",
      `id=eq.${encodeURIComponent(id)}&select=${SELECT_COLUMNS}`,
    );
    return rows[0] ? fromRow(rows[0]) : null;
  }

  async update(emergency: Emergency): Promise<Emergency> {
    const rows = await this.client.query<EmergencyRow[]>(
      "emergencies",
      `id=eq.${encodeURIComponent(emergency.id)}&select=${SELECT_COLUMNS}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          estado: emergency.estado satisfies EmergencyStatus,
          fecha_actualizacion: emergency.fechaActualizacion,
        }),
      },
    );
    return fromRow(rows[0]);
  }
}
