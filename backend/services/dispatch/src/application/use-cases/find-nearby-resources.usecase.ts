import { NearbyResourceMatch } from "../../domain/entities/resource.entity";
import { NearbyQuery, ResourceRepository } from "../../domain/repositories/resource.repository";

export class FindNearbyResourcesUseCase {
  constructor(private readonly repository: ResourceRepository) {}

  execute(query: NearbyQuery): Promise<NearbyResourceMatch[]> {
    return this.repository.nearby(query);
  }
}
