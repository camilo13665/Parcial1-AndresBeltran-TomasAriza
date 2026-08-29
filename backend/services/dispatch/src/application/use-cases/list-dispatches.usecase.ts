import { Dispatch } from "../../domain/entities/dispatch.entity";
import { DispatchRepository } from "../../domain/repositories/dispatch.repository";

export class ListDispatchesUseCase {
  constructor(private readonly repository: DispatchRepository) {}

  execute(emergenciaId?: string): Promise<Dispatch[]> {
    return this.repository.list(emergenciaId);
  }
}
