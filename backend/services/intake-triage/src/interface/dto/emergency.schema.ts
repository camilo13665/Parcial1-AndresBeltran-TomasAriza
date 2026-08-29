import { z } from "zod";
import { CITIES, EMERGENCY_PRIORITIES, EMERGENCY_STATUSES, EMERGENCY_TYPES } from "../../domain/entities/emergency.entity";

/**
 * DTOs de la capa interface: validan la forma externa (HTTP/JSON) y la
 * convierten en los tipos de dominio. Los enums se derivan de domain/entities
 * (fuente única de verdad) — el dominio no depende de Zod ni de esta capa.
 */
export const CityEnum = z.enum(CITIES);
export const EmergencyTypeEnum = z.enum(EMERGENCY_TYPES);
export const EmergencyPriorityEnum = z.enum(EMERGENCY_PRIORITIES);
export const EmergencyStatusEnum = z.enum(EMERGENCY_STATUSES);

const searchRescueMedicalSchema = z.object({
  personasAtrapadasOHeridas: z.number().int().min(0),
  riesgoInminente: z.boolean(),
  fugaDeGas: z.boolean(),
  fuego: z.boolean(),
  otrosRiesgos: z.string().max(500).optional(),
});

const shelterTemporaryHousingSchema = z.object({
  numeroAdultos: z.number().int().min(0),
  numeroNinos: z.number().int().min(0),
  numeroAdultosMayores: z.number().int().min(0),
  requerimientosAccesibilidad: z.string().max(500).optional(),
  estadoHabitabilidadVivienda: z.enum(["HABITABLE", "NO_HABITABLE", "PARCIALMENTE_HABITABLE"]),
});

const basicSuppliesHumanitarianAidSchema = z.object({
  categoriaInsumo: z.enum(["AGUA_POTABLE", "RACIONES", "KIT_PRIMEROS_AUXILIOS", "MEDICAMENTOS_CRONICOS"]),
  cantidadRequerida: z.number().int().positive(),
});

const structuralDamageAssessmentSchema = z.object({
  tipoEdificacion: z.string().min(1).max(200),
  nivelAgrietamiento: z.enum(["LEVE", "MODERADO", "SEVERO"]),
  asentamiento: z.boolean(),
  evidenciaFotograficaUrls: z.array(z.string().url()).optional(),
  riesgoColapsoSobreVias: z.boolean(),
});

/** Payload esperado en POST /emergencies — unión discriminada por `tipo`. */
export const CreateEmergencySchema = z.discriminatedUnion("tipo", [
  z.object({
    tipo: z.literal("SEARCH_RESCUE_MEDICAL"),
    ciudad: CityEnum,
    descripcion: z.string().min(1).max(1000),
    latitud: z.number(),
    longitud: z.number(),
    datosEspecificos: searchRescueMedicalSchema,
  }),
  z.object({
    tipo: z.literal("SHELTER_TEMPORARY_HOUSING"),
    ciudad: CityEnum,
    descripcion: z.string().min(1).max(1000),
    latitud: z.number(),
    longitud: z.number(),
    datosEspecificos: shelterTemporaryHousingSchema,
  }),
  z.object({
    tipo: z.literal("BASIC_SUPPLIES_HUMANITARIAN_AID"),
    ciudad: CityEnum,
    descripcion: z.string().min(1).max(1000),
    latitud: z.number(),
    longitud: z.number(),
    datosEspecificos: basicSuppliesHumanitarianAidSchema,
  }),
  z.object({
    tipo: z.literal("STRUCTURAL_DAMAGE_ASSESSMENT"),
    ciudad: CityEnum,
    descripcion: z.string().min(1).max(1000),
    latitud: z.number(),
    longitud: z.number(),
    datosEspecificos: structuralDamageAssessmentSchema,
  }),
]);

export type CreateEmergencyInput = z.infer<typeof CreateEmergencySchema>;

export const UpdateStatusSchema = z.object({
  estado: EmergencyStatusEnum,
});

export const ListEmergenciesQuerySchema = z.object({
  ciudad: CityEnum.optional(),
  prioridad: EmergencyPriorityEnum.optional(),
  estado: EmergencyStatusEnum.optional(),
});
