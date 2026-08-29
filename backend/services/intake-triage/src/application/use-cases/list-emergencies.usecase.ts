import { Emergency } from "../../domain/entities/emergency.entity";
import { EmergencyRepository, ListEmergenciesFilters } from "../../domain/repositories/emergency.repository";

export class ListEmergenciesUseCase {
  constructor(private readonly repository: EmergencyRepository) {}

  execute(filters: ListEmergenciesFilters): Promise<Emergency[]> {
    return this.repository.list(filters);
  }
}
