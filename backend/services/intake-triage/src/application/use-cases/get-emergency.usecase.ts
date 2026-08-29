import { Emergency } from "../../domain/entities/emergency.entity";
import { NotFoundError } from "../../domain/errors";
import { EmergencyRepository } from "../../domain/repositories/emergency.repository";

export class GetEmergencyUseCase {
  constructor(private readonly repository: EmergencyRepository) {}

  async execute(id: string): Promise<Emergency> {
    const emergency = await this.repository.findById(id);
    if (!emergency) throw new NotFoundError(`No existe una emergencia con id ${id}`);
    return emergency;
  }
}
