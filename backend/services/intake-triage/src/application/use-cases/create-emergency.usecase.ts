import { Emergency, NewEmergencyInput } from "../../domain/entities/emergency.entity";
import { EmergencyRepository } from "../../domain/repositories/emergency.repository";

export class CreateEmergencyUseCase {
  constructor(private readonly repository: EmergencyRepository) {}

  async execute(input: NewEmergencyInput): Promise<Emergency> {
    const sequence = (await this.repository.count()) + 1;
    const timestamp = new Date().toISOString();
    const id = `EMG-${new Date().getFullYear()}-${String(sequence).padStart(4, "0")}`;
    const emergency = Emergency.create(input, id, timestamp);
    return this.repository.create(emergency);
  }
}
