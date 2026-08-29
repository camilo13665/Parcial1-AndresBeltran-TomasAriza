import { AggregateZonesUseCase } from "../application/use-cases/aggregate-zones.usecase";
import { FindNearestZoneUseCase } from "../application/use-cases/find-nearest-zone.usecase";
import { GetZoneStatsFromIntakeUseCase } from "../application/use-cases/get-zone-stats-from-intake.usecase";
import { ListZonesUseCase } from "../application/use-cases/list-zones.usecase";
import { HttpIntakeGateway } from "../infrastructure/gateways/http-intake.gateway";

/** Composition root: el único lugar del servicio que conoce las clases concretas de infraestructura. */
const intakeGateway = new HttpIntakeGateway();

export const container = {
  listZonesUseCase: new ListZonesUseCase(),
  aggregateZonesUseCase: new AggregateZonesUseCase(),
  getZoneStatsFromIntakeUseCase: new GetZoneStatsFromIntakeUseCase(intakeGateway),
  findNearestZoneUseCase: new FindNearestZoneUseCase(),
};
