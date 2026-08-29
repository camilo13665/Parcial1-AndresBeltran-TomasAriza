import { z } from "zod";
import { CITIES, EMERGENCY_PRIORITIES } from "../../domain/entities/zone.entity";

export const CityEnum = z.enum(CITIES);
export const EmergencyPriorityEnum = z.enum(EMERGENCY_PRIORITIES);

/**
 * Geospatial no mantiene su propio store de emergencias (todavía no hay bus
 * de eventos ni base de datos compartida): recibe la lista vigente como
 * parte del request y calcula la agregación de forma stateless.
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
