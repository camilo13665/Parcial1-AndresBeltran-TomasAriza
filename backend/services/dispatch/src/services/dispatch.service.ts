import { supabaseQuery } from "../db/supabase";
import { CreateDispatchInput, CreateResourceInput, Dispatch, NearbyResource, NearbyResourcesQuery, Resource, ResourceStatus } from "../schemas/dispatch.schema";
import { ConflictError, NotFoundError } from "../errors";
import { SEED_DISPATCHES, SEED_RESOURCES } from "../data/seed";
import { intakeClient } from "../clients/intake.client";

type ResourceRow = Omit<Resource, "latitud" | "longitud"> & {
  latitud: number | null;
  longitud: number | null;
  fecha_creacion: string;
  fecha_actualizacion: string;
};
type DispatchRow = { id: string; emergencia_id: string; recurso_ids: string[]; fecha_asignacion: string; notas?: string };
/** `ubicacion` (geography, agregada en 002_rls_and_postgis.sql) es un espejo interno para PostGIS, no un campo del contrato REST. */
const RESOURCE_SELECT_COLUMNS = "id,tipo,organismo,ciudad,estado,latitud,longitud,fecha_creacion,fecha_actualizacion";
type NearbyResourceRow = { id: string; tipo: string; organismo: string; ciudad: string; estado: string; distancia_metros: number };
const resourceFromRow = (r: ResourceRow): Resource => ({
  ...r,
  latitud: r.latitud ?? undefined,
  longitud: r.longitud ?? undefined,
  fechaCreacion: r.fecha_creacion,
  fechaActualizacion: r.fecha_actualizacion,
});
const dispatchFromRow = (r: DispatchRow): Dispatch => ({ id: r.id, emergenciaId: r.emergencia_id, recursoIds: r.recurso_ids, fechaAsignacion: r.fecha_asignacion, notas: r.notas });

async function ensureSeeds() {
  await supabaseQuery("resources", "on_conflict=id", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=minimal" }, body: JSON.stringify(SEED_RESOURCES.map((r) => ({ id: r.id, tipo: r.tipo, organismo: r.organismo, ciudad: r.ciudad, estado: r.estado, latitud: r.latitud ?? null, longitud: r.longitud ?? null, fecha_creacion: r.fechaCreacion, fecha_actualizacion: r.fechaActualizacion }))) });
  await supabaseQuery("dispatches", "on_conflict=id", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=minimal" }, body: JSON.stringify(SEED_DISPATCHES.map((d) => ({ id: d.id, emergencia_id: d.emergenciaId, recurso_ids: d.recursoIds, notas: d.notas, fecha_asignacion: d.fechaAsignacion }))) });
}

export interface ResourceFilters { ciudad?: string; tipo?: string; estado?: string; }

export const resourceService = {
  async create(input: CreateResourceInput): Promise<Resource> {
    const rows = await supabaseQuery<ResourceRow[]>("resources", `select=${RESOURCE_SELECT_COLUMNS}`, { method: "POST", body: JSON.stringify({ id: `RES-${Date.now()}`, tipo: input.tipo, organismo: input.organismo, ciudad: input.ciudad, estado: input.estado, latitud: input.latitud ?? null, longitud: input.longitud ?? null }) });
    return resourceFromRow(rows[0]);
  },
  /** Recursos dentro de un radio (metros) de un punto, vía la RPC PostGIS `nearby_resources`. */
  async nearby(query: NearbyResourcesQuery): Promise<NearbyResource[]> {
    const rows = await supabaseQuery<NearbyResourceRow[]>("rpc/nearby_resources", "", {
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
  },
  async list(filters: ResourceFilters): Promise<Resource[]> {
    await ensureSeeds();
    const query = new URLSearchParams({ select: RESOURCE_SELECT_COLUMNS, order: "id.asc" });
    for (const [key, value] of Object.entries(filters)) if (value) query.set(key, `eq.${value}`);
    const rows = await supabaseQuery<ResourceRow[]>("resources", query.toString());
    return rows.map(resourceFromRow);
  },
  async getById(id: string): Promise<Resource> {
    const rows = await supabaseQuery<ResourceRow[]>("resources", `id=eq.${encodeURIComponent(id)}&select=${RESOURCE_SELECT_COLUMNS}`);
    if (!rows[0]) throw new NotFoundError(`No existe un recurso con id ${id}`);
    return resourceFromRow(rows[0]);
  },
  async updateStatus(id: string, estado: ResourceStatus): Promise<Resource> {
    const rows = await supabaseQuery<ResourceRow[]>("resources", `id=eq.${encodeURIComponent(id)}&select=${RESOURCE_SELECT_COLUMNS}`, { method: "PATCH", body: JSON.stringify({ estado, fecha_actualizacion: new Date().toISOString() }) });
    if (!rows[0]) throw new NotFoundError(`No existe un recurso con id ${id}`);
    return resourceFromRow(rows[0]);
  },
  async stats() {
    const resources = await this.list({});
    return { total: resources.length, disponibles: resources.filter((r) => r.estado === "DISPONIBLE").length, porEstado: Object.fromEntries(["DISPONIBLE", "ASIGNADO", "EN_RUTA", "OCUPADO", "INACTIVO"].map((s) => [s, resources.filter((r) => r.estado === s).length])) };
  },
};

export const dispatchService = {
  async create(input: CreateDispatchInput, authorization?: string) {
    const emergency = await intakeClient.getEmergency(input.emergenciaId);
    if (emergency.estado === "RESUELTA" || emergency.estado === "CANCELADA") throw new ConflictError(`La emergencia ${input.emergenciaId} está en estado final`);
    if (emergency.estado !== "PRIORIZADA") throw new ConflictError(`La emergencia ${input.emergenciaId} debe estar PRIORIZADA`);
    const resources = await Promise.all(input.recursoIds.map((id) => resourceService.getById(id)));
    if (resources.some((r) => r.ciudad !== emergency.ciudad)) throw new ConflictError("Los recursos deben pertenecer a la ciudad de la emergencia");
    if (resources.some((r) => r.estado !== "DISPONIBLE")) throw new ConflictError("Todos los recursos deben estar disponibles");
    const rows = await supabaseQuery<DispatchRow[]>("dispatches", "", { method: "POST", body: JSON.stringify({ id: `DSP-${Date.now()}`, emergencia_id: input.emergenciaId, recurso_ids: input.recursoIds, notas: input.notas }) });
    await Promise.all(resources.map((r) => resourceService.updateStatus(r.id, "ASIGNADO")));
    let sincronizacionIntake: { ok: boolean; mensaje?: string } = { ok: true };
    try { await intakeClient.updateEmergencyStatus(input.emergenciaId, "ASIGNADA", authorization); } catch (err) { sincronizacionIntake = { ok: false, mensaje: err instanceof Error ? err.message : "Error de sincronización" }; }
    return { dispatch: dispatchFromRow(rows[0]), sincronizacionIntake };
  },
  async list(emergenciaId?: string): Promise<Dispatch[]> {
    await ensureSeeds();
    const query = new URLSearchParams({ select: "*", order: "fecha_asignacion.desc" });
    if (emergenciaId) query.set("emergencia_id", `eq.${encodeURIComponent(emergenciaId)}`);
    const rows = await supabaseQuery<DispatchRow[]>("dispatches", query.toString());
    return rows.map(dispatchFromRow);
  },
  async getById(id: string): Promise<Dispatch> {
    const rows = await supabaseQuery<DispatchRow[]>("dispatches", `id=eq.${encodeURIComponent(id)}&select=*`);
    if (!rows[0]) throw new NotFoundError(`No existe un despacho con id ${id}`);
    return dispatchFromRow(rows[0]);
  },
  async releaseByEmergency(emergenciaId: string) {
    const dispatches = await this.list(emergenciaId);
    const ids = [...new Set(dispatches.flatMap((d) => d.recursoIds))];
    await Promise.all(ids.map((id) => resourceService.updateStatus(id, "DISPONIBLE")));
    return { recursoIdsLiberados: ids };
  },
};
