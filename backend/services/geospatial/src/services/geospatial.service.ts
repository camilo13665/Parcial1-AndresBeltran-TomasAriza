import { AggregateZonesInput, ProximityInput, ZONES } from "../schemas/zone.schema";
import { intakeClient } from "../clients/intake.client";

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Distancia entre dos puntos geográficos, en kilómetros (fórmula de Haversine). */
export function haversineDistanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return EARTH_RADIUS_KM * c;
}

export const geospatialService = {
  listZones() {
    return ZONES;
  },

  /**
   * Agrega las emergencias recibidas por zona y prioridad. Stateless: no
   * guarda nada, calcula sobre la lista de emergencias que recibe.
   */
  aggregate(emergencias: AggregateZonesInput["emergencias"]) {
    return ZONES.map((zone) => {
      const enZona = emergencias.filter((e) => e.ciudad === zone.ciudad);
      return {
        ciudad: zone.ciudad,
        nombre: zone.nombre,
        centro: { latitud: zone.latitud, longitud: zone.longitud },
        total: enZona.length,
        porPrioridad: {
          CRITICA: enZona.filter((e) => e.prioridad === "CRITICA").length,
          ALTA: enZona.filter((e) => e.prioridad === "ALTA").length,
          MEDIA: enZona.filter((e) => e.prioridad === "MEDIA").length,
          BAJA: enZona.filter((e) => e.prioridad === "BAJA").length,
        },
      };
    });
  },

  /**
   * Igual que `aggregate`, pero obteniendo las emergencias directamente
   * de Intake & Triage por HTTP en vez de recibirlas en el request. Este
   * es el camino real de "Geospatial consume la información de
   * emergencias mediante la API correspondiente".
   *
   * Los datos remotos llegan como `string` (Geospatial no comparte los
   * enums de Intake & Triage — cada servicio es dueño de su contrato), así
   * que se filtran defensivamente antes de agregarlos: una emergencia con
   * una ciudad o prioridad que Geospatial no reconoce se descarta en vez
   * de romper la agregación.
   */
  async statsFromIntake() {
    const remotas = await intakeClient.listEmergencies();
    const ciudadesValidas = new Set<string>(ZONES.map((z) => z.ciudad));
    const prioridadesValidas = new Set<string>(["CRITICA", "ALTA", "MEDIA", "BAJA"]);

    const emergencias = remotas
      .filter((e) => ciudadesValidas.has(e.ciudad) && prioridadesValidas.has(e.prioridad))
      .map((e) => ({
        id: e.id,
        ciudad: e.ciudad as AggregateZonesInput["emergencias"][number]["ciudad"],
        prioridad: e.prioridad as AggregateZonesInput["emergencias"][number]["prioridad"],
        latitud: e.latitud,
        longitud: e.longitud,
      }));

    return this.aggregate(emergencias);
  },

  /** Encuentra la zona monitoreada más cercana a un punto dado. */
  nearestZone(input: ProximityInput) {
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
  },
};
