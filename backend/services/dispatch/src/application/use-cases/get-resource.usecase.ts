import { Resource } from "../../domain/entities/resource.entity";
import { NotFoundError } from "../../domain/errors";
import { ResourceRepository } from "../../domain/repositories/resource.repository";

export class GetResourceUseCase {
  constructor(private readonly repository: ResourceRepository) {}

  async execute(id: string): Promise<Resource> {
    const resource = await this.repository.findById(id);
    if (!resource) throw new NotFoundError(`No existe un recurso con id ${id}`);
    return resource;
  }
}
