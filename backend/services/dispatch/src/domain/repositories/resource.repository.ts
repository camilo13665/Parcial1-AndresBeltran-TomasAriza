import { NearbyResourceMatch, Resource, ResourceStatus } from "../entities/resource.entity";

export interface ResourceFilters {
  ciudad?: string;
  tipo?: string;
  estado?: string;
}

export interface NearbyQuery {
  latitud: number;
  longitud: number;
  radioMetros: number;
  soloDisponibles: boolean;
}

/** Puerto de persistencia — los casos de uso dependen de esta interfaz, nunca de Supabase directamente. */
export interface ResourceRepository {
  create(resource: Resource): Promise<Resource>;
  list(filters: ResourceFilters): Promise<Resource[]>;
  findById(id: string): Promise<Resource | null>;
  updateStatus(id: string, estado: ResourceStatus): Promise<Resource | null>;
  /** Recursos dentro de un radio (metros) de un punto, vía la RPC PostGIS `nearby_resources`. */
  nearby(query: NearbyQuery): Promise<NearbyResourceMatch[]>;
}
