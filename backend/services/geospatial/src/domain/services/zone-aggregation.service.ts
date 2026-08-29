import { EMERGENCY_PRIORITIES, EmergencySummary, Zone } from "../entities/zone.entity";

export interface ZoneAggregate {
  ciudad: string;
  nombre: string;
  centro: { latitud: number; longitud: number };
  total: number;
  porPrioridad: Record<string, number>;
}

/** Agrega emergencias por zona y prioridad. Servicio de dominio: opera sobre una colección de zonas, no sobre una sola. */
export function aggregateEmergenciesByZone(zones: Zone[], emergencias: EmergencySummary[]): ZoneAggregate[] {
  return zones.map((zone) => {
    const enZona = emergencias.filter((e) => e.ciudad === zone.ciudad);
    return {
      ciudad: zone.ciudad,
      nombre: zone.nombre,
      centro: { latitud: zone.latitud, longitud: zone.longitud },
      total: enZona.length,
      porPrioridad: Object.fromEntries(
        EMERGENCY_PRIORITIES.map((p) => [p, enZona.filter((e) => e.prioridad === p).length]),
      ),
    };
  });
}
