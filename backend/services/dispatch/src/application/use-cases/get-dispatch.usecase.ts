import { Dispatch } from "../../domain/entities/dispatch.entity";
import { NotFoundError } from "../../domain/errors";
import { DispatchRepository } from "../../domain/repositories/dispatch.repository";

export class GetDispatchUseCase {
  constructor(private readonly repository: DispatchRepository) {}

  async execute(id: string): Promise<Dispatch> {
    const dispatch = await this.repository.findById(id);
    if (!dispatch) throw new NotFoundError(`No existe un despacho con id ${id}`);
    return dispatch;
  }
}
