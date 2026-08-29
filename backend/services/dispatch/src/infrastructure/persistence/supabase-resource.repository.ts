import { NearbyResourceMatch, Resource, ResourceProps, ResourceStatus } from "../../domain/entities/resource.entity";
import { NearbyQuery, ResourceFilters, ResourceRepository } from "../../domain/repositories/resource.repository";
import { PostgrestClient } from "./postgrest-client";
import { SEED_RESOURCES } from "./seed-data";

type ResourceRow = Omit<ResourceProps, "latitud" | "longitud"> & {
  latitud: number | null;
  longitud: number | null;
  fecha_creacion: string;
  fecha_actualizacion: string;
};

type NearbyResourceRow = {
  id: string;
  tipo: string;
  organismo: string;
  ciudad: string;
  estado: string;
  distancia_metros: number;
};

/** `ubicacion` (geography, agregada en 002_rls_and_postgis.sql) es un espejo interno para PostGIS, no un campo del contrato REST. */
const SELECT_COLUMNS = "id,tipo,organismo,ciudad,estado,latitud,longitud,fecha_creacion,fecha_actualizacion";

function fromRow(row: ResourceRow): Resource {
  return new Resource({
    id: row.id,
    tipo: row.tipo,
    organismo: row.organismo,
    ciudad: row.ciudad,
    estado: row.estado,
    latitud: row.latitud ?? undefined,
    longitud: row.longitud ?? undefined,
    fechaCreacion: row.fecha_creacion,
    fechaActualizacion: row.fecha_actualizacion,
  });
}

function toRow(resource: Resource) {
  return {
    id: resource.id,
    tipo: resource.tipo,
    organismo: resource.organismo,
    ciudad: resource.ciudad,
    estado: resource.estado,
    latitud: resource.latitud ?? null,
    longitud: resource.longitud ?? null,
    fecha_creacion: resource.fechaCreacion,
    fecha_actualizacion: resource.fechaActualizacion,
  };
}

/** Implementación concreta del puerto ResourceRepository sobre Supabase/PostgREST. */
export class SupabaseResourceRepository implements ResourceRepository {
  constructor(private readonly client: PostgrestClient) {}

  private async ensureSeeded(): Promise<void> {
    await this.client.query("resources", "on_conflict=id", {
      method: "POST",
      headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
      body: JSON.stringify(SEED_RESOURCES.map(toRow)),
    });
  }

  async create(resource: Resource): Promise<Resource> {
    const rows = await this.client.query<ResourceRow[]>("resources", `select=${SELECT_COLUMNS}`, {
      method: "POST",
      body: JSON.stringify(toRow(resource)),
    });
    return fromRow(rows[0]);
  }

  async list(filters: ResourceFilters): Promise<Resource[]> {
    await this.ensureSeeded();
    const query = new URLSearchParams({ select: SELECT_COLUMNS, order: "id.asc" });
    for (const [key, value] of Object.entries(filters)) if (value) query.set(key, `eq.${value}`);
    const rows = await this.client.query<ResourceRow[]>("resources", query.toString());
    return rows.map(fromRow);
  }

  async findById(id: string): Promise<Resource | null> {
    const rows = await this.client.query<ResourceRow[]>(
      "resources",
      `id=eq.${encodeURIComponent(id)}&select=${SELECT_COLUMNS}`,
    );
    return rows[0] ? fromRow(rows[0]) : null;
  }

  async updateStatus(id: string, estado: ResourceStatus): Promise<Resource | null> {
    const rows = await this.client.query<ResourceRow[]>(
      "resources",
      `id=eq.${encodeURIComponent(id)}&select=${SELECT_COLUMNS}`,
      { method: "PATCH", body: JSON.stringify({ estado, fecha_actualizacion: new Date().toISOString() }) },
    );
    return rows[0] ? fromRow(rows[0]) : null;
  }

  async nearby(query: NearbyQuery): Promise<NearbyResourceMatch[]> {
    const rows = await this.client.query<NearbyResourceRow[]>("rpc/nearby_resources", "", {
      method: "POST",
      body: JSON.stringify({
        lat: query.latitud,
        lng: query.longitud,
        radio_metros: query.radioMetros,
        solo_disponibles: query.soloDisponibles,
      }),
    });
    return rows.map((r) => ({
      id: r.id,
      tipo: r.tipo as Resource["tipo"],
      organismo: r.organismo,
      ciudad: r.ciudad as Resource["ciudad"],
      estado: r.estado as ResourceStatus,
      distanciaMetros: Math.round(r.distancia_metros),
    }));
  }
}
