import { ZONES, Zone } from "../../domain/entities/zone.entity";

export class ListZonesUseCase {
  execute(): Zone[] {
    return ZONES;
  }
}
