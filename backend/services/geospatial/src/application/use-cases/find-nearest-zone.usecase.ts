import { ZONES } from "../../domain/entities/zone.entity";
import { haversineDistanceKm } from "../../domain/services/haversine";

export interface ProximityInput {
  latitud: number;
  longitud: number;
}

export interface NearestZoneResult {
  ciudad: string;
  nombre: string;
  distanciaKm: number;
  dentroDelRadio: boolean;
}

/** Encuentra la zona monitoreada más cercana a un punto dado. */
export class FindNearestZoneUseCase {
  execute(input: ProximityInput): NearestZoneResult[] {
    const withDistance = ZONES.map((zone) => ({
      zone,
      distanceKm: haversineDistanceKm(
        { lat: input.latitud, lng: input.longitud },
        { lat: zone.latitud, lng: zone.longitud },
      ),
    })).sort((a, b) => a.distanceKm - b.distanceKm);

    return withDistance.map(({ zone, distanceKm }) => ({
      ciudad: zone.ciudad,
      nombre: zone.nombre,
      distanciaKm: Math.round(distanceKm * 10) / 10,
      dentroDelRadio: distanceKm <= zone.radioKm,
    }));
  }
}
