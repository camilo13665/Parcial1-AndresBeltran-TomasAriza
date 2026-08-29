import { Emergency } from "../entities/emergency.entity";

export interface ListEmergenciesFilters {
  ciudad?: string;
  prioridad?: string;
  estado?: string;
}

/**
 * Puerto de persistencia (Dependency Inversion): los casos de uso dependen
 * de esta interfaz, nunca de Supabase directamente. La implementación
 * concreta vive en infrastructure/persistence y se inyecta en
 * composition/container.ts.
 */
export interface EmergencyRepository {
  count(): Promise<number>;
  create(emergency: Emergency): Promise<Emergency>;
  list(filters: ListEmergenciesFilters): Promise<Emergency[]>;
  findById(id: string): Promise<Emergency | null>;
  update(emergency: Emergency): Promise<Emergency>;
}
