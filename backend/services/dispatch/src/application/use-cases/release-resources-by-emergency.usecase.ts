import { DispatchRepository } from "../../domain/repositories/dispatch.repository";
import { ResourceRepository } from "../../domain/repositories/resource.repository";

export interface ReleaseResourcesResult {
  recursoIdsLiberados: string[];
}

/** Libera (vuelve DISPONIBLE) todos los recursos que hayan sido asignados a una emergencia. */
export class ReleaseResourcesByEmergencyUseCase {
  constructor(
    private readonly dispatchRepository: DispatchRepository,
    private readonly resourceRepository: ResourceRepository,
  ) {}

  async execute(emergenciaId: string): Promise<ReleaseResourcesResult> {
    const dispatches = await this.dispatchRepository.list(emergenciaId);
    const ids = [...new Set(dispatches.flatMap((d) => d.recursoIds))];
    await Promise.all(ids.map((id) => this.resourceRepository.updateStatus(id, "DISPONIBLE")));
    return { recursoIdsLiberados: ids };
  }
}
