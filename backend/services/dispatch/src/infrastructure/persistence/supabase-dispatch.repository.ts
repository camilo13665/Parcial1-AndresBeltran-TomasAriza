import { Dispatch } from "../../domain/entities/dispatch.entity";
import { DispatchRepository } from "../../domain/repositories/dispatch.repository";
import { PostgrestClient } from "./postgrest-client";
import { SEED_DISPATCHES } from "./seed-data";

type DispatchRow = {
  id: string;
  emergencia_id: string;
  recurso_ids: string[];
  fecha_asignacion: string;
  notas?: string;
};

function fromRow(row: DispatchRow): Dispatch {
  return new Dispatch({
    id: row.id,
    emergenciaId: row.emergencia_id,
    recursoIds: row.recurso_ids,
    fechaAsignacion: row.fecha_asignacion,
    notas: row.notas,
  });
}

function toRow(dispatch: Dispatch) {
  return {
    id: dispatch.id,
    emergencia_id: dispatch.emergenciaId,
    recurso_ids: dispatch.recursoIds,
    notas: dispatch.notas,
    fecha_asignacion: dispatch.fechaAsignacion,
  };
}

/** Implementación concreta del puerto DispatchRepository sobre Supabase/PostgREST. */
export class SupabaseDispatchRepository implements DispatchRepository {
  constructor(private readonly client: PostgrestClient) {}

  private async ensureSeeded(): Promise<void> {
    await this.client.query("dispatches", "on_conflict=id", {
      method: "POST",
      headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
      body: JSON.stringify(SEED_DISPATCHES.map(toRow)),
    });
  }

  async create(dispatch: Dispatch): Promise<Dispatch> {
    const rows = await this.client.query<DispatchRow[]>("dispatches", "", {
      method: "POST",
      body: JSON.stringify(toRow(dispatch)),
    });
    return fromRow(rows[0]);
  }

  async list(emergenciaId?: string): Promise<Dispatch[]> {
    await this.ensureSeeded();
    const query = new URLSearchParams({ select: "*", order: "fecha_asignacion.desc" });
    if (emergenciaId) query.set("emergencia_id", `eq.${encodeURIComponent(emergenciaId)}`);
    const rows = await this.client.query<DispatchRow[]>("dispatches", query.toString());
    return rows.map(fromRow);
  }

  async findById(id: string): Promise<Dispatch | null> {
    const rows = await this.client.query<DispatchRow[]>("dispatches", `id=eq.${encodeURIComponent(id)}&select=*`);
    return rows[0] ? fromRow(rows[0]) : null;
  }
}
