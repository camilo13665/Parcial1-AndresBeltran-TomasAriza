import { RESOURCE_STATUSES } from "../../domain/entities/resource.entity";
import { ResourceRepository } from "../../domain/repositories/resource.repository";

export interface ResourceStats {
  total: number;
  disponibles: number;
  porEstado: Record<string, number>;
}

export class GetResourceStatsUseCase {
  constructor(private readonly repository: ResourceRepository) {}

  async execute(): Promise<ResourceStats> {
    const resources = await this.repository.list({});
    return {
      total: resources.length,
      disponibles: resources.filter((r) => r.estado === "DISPONIBLE").length,
      porEstado: Object.fromEntries(
        RESOURCE_STATUSES.map((s) => [s, resources.filter((r) => r.estado === s).length]),
      ),
    };
  }
}
