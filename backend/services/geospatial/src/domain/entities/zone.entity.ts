/** Fuente única de verdad de los enums — el DTO de interface/dto los deriva de aquí. */
export const CITIES = ["CHOCO", "PEREIRA", "CALI", "MANIZALES"] as const;
export type City = (typeof CITIES)[number];

export const EMERGENCY_PRIORITIES = ["CRITICA", "ALTA", "MEDIA", "BAJA"] as const;
export type EmergencyPriority = (typeof EMERGENCY_PRIORITIES)[number];

export interface ZoneProps {
  ciudad: City;
  nombre: string;
  latitud: number;
  longitud: number;
  radioKm: number;
}

/** Metadata de una zona monitoreada — centro aproximado y radio de referencia. */
export class Zone {
  readonly ciudad: City;
  readonly nombre: string;
  readonly latitud: number;
  readonly longitud: number;
  readonly radioKm: number;

  constructor(props: ZoneProps) {
    this.ciudad = props.ciudad;
    this.nombre = props.nombre;
    this.latitud = props.latitud;
    this.longitud = props.longitud;
    this.radioKm = props.radioKm;
  }
}

/** Las 4 zonas monitoreadas por esta fase de la plataforma — dato de dominio fijo, no persistido. */
export const ZONES: Zone[] = [
  new Zone({ ciudad: "CHOCO", nombre: "Chocó", latitud: 5.6919, longitud: -76.6583, radioKm: 40 }),
  new Zone({ ciudad: "PEREIRA", nombre: "Pereira", latitud: 4.8143, longitud: -75.6946, radioKm: 25 }),
  new Zone({ ciudad: "CALI", nombre: "Cali", latitud: 3.4516, longitud: -76.532, radioKm: 30 }),
  new Zone({ ciudad: "MANIZALES", nombre: "Manizales", latitud: 5.0689, longitud: -75.5174, radioKm: 20 }),
];

/**
 * Lo único que Geospatial necesita saber de una emergencia ajena, para
 * agregarla por zona. No es la entidad Emergency completa — esa la posee
 * Intake & Triage.
 */
export interface EmergencySummary {
  id: string;
  ciudad: City;
  prioridad: EmergencyPriority;
  latitud: number;
  longitud: number;
}
