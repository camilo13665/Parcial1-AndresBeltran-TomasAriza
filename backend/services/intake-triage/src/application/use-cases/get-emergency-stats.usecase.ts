import { CITIES, EMERGENCY_PRIORITIES } from "../../domain/entities/emergency.entity";
import { EmergencyRepository } from "../../domain/repositories/emergency.repository";

export interface EmergencyStats {
  total: number;
  porPrioridad: Record<string, number>;
  porCiudad: Record<string, number>;
}

export class GetEmergencyStatsUseCase {
  constructor(private readonly repository: EmergencyRepository) {}

  async execute(): Promise<EmergencyStats> {
    const emergencies = await this.repository.list({});
    return {
      total: emergencies.length,
      porPrioridad: Object.fromEntries(
        EMERGENCY_PRIORITIES.map((p) => [p, emergencies.filter((e) => e.prioridad === p).length]),
      ),
      porCiudad: Object.fromEntries(CITIES.map((c) => [c, emergencies.filter((e) => e.ciudad === c).length])),
    };
  }
}
