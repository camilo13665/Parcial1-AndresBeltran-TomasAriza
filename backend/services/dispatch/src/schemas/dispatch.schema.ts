import { z } from "zod";

export const CityEnum = z.enum(["CHOCO", "PEREIRA", "CALI", "MANIZALES"]);
export type City = z.infer<typeof CityEnum>;

export const ResourceTypeEnum = z.enum(["BOMBEROS", "CRUZ_ROJA", "DEFENSA_CIVIL", "UNGRD", "MEDICO", "RESCATE"]);
export type ResourceType = z.infer<typeof ResourceTypeEnum>;

export const ResourceStatusEnum = z.enum(["DISPONIBLE", "ASIGNADO", "EN_RUTA", "OCUPADO", "INACTIVO"]);
export type ResourceStatus = z.infer<typeof ResourceStatusEnum>;

export interface Resource {
  id: string;
  tipo: ResourceType;
  organismo: string;
  ciudad: City;
  estado: ResourceStatus;
  latitud?: number;
  longitud?: number;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export const CreateResourceSchema = z.object({
  tipo: ResourceTypeEnum,
  organismo: z.string().min(1).max(200),
  ciudad: CityEnum,
  estado: ResourceStatusEnum.default("DISPONIBLE"),
  latitud: z.number().optional(),
  longitud: z.number().optional(),
});
export type CreateResourceInput = z.infer<typeof CreateResourceSchema>;

/** Query de GET /resources/nearby — proximidad real vía PostGIS (RPC nearby_resources). */
export const NearbyResourcesQuerySchema = z.object({
  latitud: z.coerce.number(),
  longitud: z.coerce.number(),
  radioMetros: z.coerce.number().positive().default(15000),
  // z.coerce.boolean() coacciona con Boolean(str): "false" da true. Se
  // acepta explícitamente "true"/"false" como texto de querystring.
  soloDisponibles: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .default(true)
    .transform((value) => (typeof value === "boolean" ? value : value === "true")),
});
export type NearbyResourcesQuery = z.infer<typeof NearbyResourcesQuerySchema>;

export interface NearbyResource {
  id: string;
  tipo: ResourceType;
  organismo: string;
  ciudad: City;
  estado: ResourceStatus;
  distanciaMetros: number;
}

export const UpdateResourceStatusSchema = z.object({
  estado: ResourceStatusEnum,
});

export const ListResourcesQuerySchema = z.object({
  ciudad: CityEnum.optional(),
  tipo: ResourceTypeEnum.optional(),
  estado: ResourceStatusEnum.optional(),
});

/** Un despacho asocia una emergencia con uno o más recursos asignados para atenderla. */
export interface Dispatch {
  id: string;
  emergenciaId: string;
  recursoIds: string[];
  fechaAsignacion: string;
  notas?: string;
}

export const CreateDispatchSchema = z.object({
  emergenciaId: z.string().min(1),
  recursoIds: z.array(z.string().min(1)).min(1, "Debes asignar al menos un recurso"),
  notas: z.string().max(500).optional(),
});
export type CreateDispatchInput = z.infer<typeof CreateDispatchSchema>;

/** Libera los recursos asociados a una emergencia (la vuelve a poner DISPONIBLE). */
export const ReleaseResourcesSchema = z.object({
  emergenciaId: z.string().min(1),
});
export type ReleaseResourcesInput = z.infer<typeof ReleaseResourcesSchema>;
