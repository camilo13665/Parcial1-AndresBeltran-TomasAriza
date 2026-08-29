import { EmergencySummary, ZONES } from "../../domain/entities/zone.entity";
import { aggregateEmergenciesByZone, ZoneAggregate } from "../../domain/services/zone-aggregation.service";

/** Agregación "manual": recibe la lista de emergencias vigentes ya resuelta por quien llama. */
export class AggregateZonesUseCase {
  execute(emergencias: EmergencySummary[]): ZoneAggregate[] {
    return aggregateEmergenciesByZone(ZONES, emergencias);
  }
}
