import { Resource } from "../../domain/entities/resource.entity";
import { ResourceFilters, ResourceRepository } from "../../domain/repositories/resource.repository";

export class ListResourcesUseCase {
  constructor(private readonly repository: ResourceRepository) {}

  execute(filters: ResourceFilters): Promise<Resource[]> {
    return this.repository.list(filters);
  }
}
