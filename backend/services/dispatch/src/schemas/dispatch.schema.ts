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
  fechaCreacion: string;
  fechaActualizacion: string;
}

export const CreateResourceSchema = z.object({
  tipo: ResourceTypeEnum,
  organismo: z.string().min(1).max(200),
  ciudad: CityEnum,
  estado: ResourceStatusEnum.default("DISPONIBLE"),
});
export type CreateResourceInput = z.infer<typeof CreateResourceSchema>;

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
