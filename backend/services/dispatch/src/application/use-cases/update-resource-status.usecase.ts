import { Resource, ResourceStatus } from "../../domain/entities/resource.entity";
import { NotFoundError } from "../../domain/errors";
import { ResourceRepository } from "../../domain/repositories/resource.repository";

export class UpdateResourceStatusUseCase {
  constructor(private readonly repository: ResourceRepository) {}

  async execute(id: string, estado: ResourceStatus): Promise<Resource> {
    const resource = await this.repository.updateStatus(id, estado);
    if (!resource) throw new NotFoundError(`No existe un recurso con id ${id}`);
    return resource;
  }
}
