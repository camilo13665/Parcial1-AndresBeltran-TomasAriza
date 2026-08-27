import { z } from "zod";

export const CityEnum = z.enum(["CHOCO", "PEREIRA", "CALI", "MANIZALES"]);
export type City = z.infer<typeof CityEnum>;

export const EmergencyPriorityEnum = z.enum(["CRITICA", "ALTA", "MEDIA", "BAJA"]);

/** Metadata estática de cada zona monitoreada — centro aproximado y radio de referencia. */
export interface Zone {
  ciudad: City;
  nombre: string;
  latitud: number;
  longitud: number;
  radioKm: number;
}

export const ZONES: Zone[] = [
  { ciudad: "CHOCO", nombre: "Chocó", latitud: 5.6919, longitud: -76.6583, radioKm: 40 },
  { ciudad: "PEREIRA", nombre: "Pereira", latitud: 4.8143, longitud: -75.6946, radioKm: 25 },
  { ciudad: "CALI", nombre: "Cali", latitud: 3.4516, longitud: -76.532, radioKm: 30 },
  { ciudad: "MANIZALES", nombre: "Manizales", latitud: 5.0689, longitud: -75.5174, radioKm: 20 },
];

/**
 * Geospatial no mantiene su propio store de emergencias (todavía no hay
 * bus de eventos ni base de datos compartida): recibe la lista vigente
 * como parte del request y calcula la agregación de forma stateless.
 */
export const AggregateZonesSchema = z.object({
  emergencias: z.array(
    z.object({
      id: z.string(),
      ciudad: CityEnum,
      prioridad: EmergencyPriorityEnum,
      latitud: z.number(),
      longitud: z.number(),
    }),
  ),
});
export type AggregateZonesInput = z.infer<typeof AggregateZonesSchema>;

export const ProximitySchema = z.object({
  latitud: z.number().min(-4.5).max(13.5),
  longitud: z.number().min(-82).max(-66),
});
export type ProximityInput = z.infer<typeof ProximitySchema>;
