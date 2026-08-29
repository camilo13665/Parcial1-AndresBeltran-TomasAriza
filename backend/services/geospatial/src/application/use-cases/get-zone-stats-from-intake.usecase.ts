import { CITIES, EMERGENCY_PRIORITIES, EmergencySummary, ZONES } from "../../domain/entities/zone.entity";
import { EmergencyFeedPort } from "../../domain/ports/emergency-feed.port";
import { aggregateEmergenciesByZone, ZoneAggregate } from "../../domain/services/zone-aggregation.service";

/**
 * Agregación "real": consulta por HTTP las emergencias vigentes en Intake &
 * Triage (a través del puerto, sin conocer el detalle HTTP) y calcula las
 * estadísticas por zona sobre esos datos. Este es el caso de uso que
 * demuestra la comunicación entre microservicios.
 *
 * Los datos remotos llegan como `string` (Geospatial no comparte los enums
 * de Intake & Triage — cada servicio es dueño de su contrato), así que se
 * filtran defensivamente antes de agregarlos: una emergencia con una ciudad
 * o prioridad que Geospatial no reconoce se descarta en vez de romper la
 * agregación.
 */
export class GetZoneStatsFromIntakeUseCase {
  constructor(private readonly emergencyFeed: EmergencyFeedPort) {}

  async execute(): Promise<ZoneAggregate[]> {
    const remotas = await this.emergencyFeed.listEmergencies();
    const ciudadesValidas = new Set<string>(CITIES);
    const prioridadesValidas = new Set<string>(EMERGENCY_PRIORITIES);

    const emergencias: EmergencySummary[] = remotas
      .filter((e) => ciudadesValidas.has(e.ciudad) && prioridadesValidas.has(e.prioridad))
      .map((e) => ({
        id: e.id,
        ciudad: e.ciudad as EmergencySummary["ciudad"],
        prioridad: e.prioridad as EmergencySummary["prioridad"],
        latitud: e.latitud,
        longitud: e.longitud,
      }));

    return aggregateEmergenciesByZone(ZONES, emergencias);
  }
}
