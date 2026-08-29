import { Dispatch } from "../entities/dispatch.entity";

/** Puerto de persistencia — los casos de uso dependen de esta interfaz, nunca de Supabase directamente. */
export interface DispatchRepository {
  create(dispatch: Dispatch): Promise<Dispatch>;
  list(emergenciaId?: string): Promise<Dispatch[]>;
  findById(id: string): Promise<Dispatch | null>;
}
