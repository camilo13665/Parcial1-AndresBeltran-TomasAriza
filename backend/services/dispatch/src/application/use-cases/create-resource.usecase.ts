import { NewResourceInput, Resource } from "../../domain/entities/resource.entity";
import { ResourceRepository } from "../../domain/repositories/resource.repository";

export class CreateResourceUseCase {
  constructor(private readonly repository: ResourceRepository) {}

  execute(input: NewResourceInput): Promise<Resource> {
    const resource = Resource.create(input, `RES-${Date.now()}`, new Date().toISOString());
    return this.repository.create(resource);
  }
}
