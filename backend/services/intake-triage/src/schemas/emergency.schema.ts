import { z } from "zod";

/**
 * Contrato de dominio de Intake & Triage.
 *
 * Cada microservicio es dueño de su propio contrato (no se comparte un
 * paquete de tipos entre servicios en tiempo de ejecución, para mantenerlos
 * verdaderamente desacoplados). En una fase posterior esto podría
 * formalizarse con un registro de esquemas o un paquete de contratos
 * versionado.
 */

export const CityEnum = z.enum(["CHOCO", "PEREIRA", "CALI", "MANIZALES"]);
export type City = z.infer<typeof CityEnum>;

export const EmergencyTypeEnum = z.enum([
  "SEARCH_RESCUE_MEDICAL",
  "SHELTER_TEMPORARY_HOUSING",
  "BASIC_SUPPLIES_HUMANITARIAN_AID",
  "STRUCTURAL_DAMAGE_ASSESSMENT",
]);
export type EmergencyType = z.infer<typeof EmergencyTypeEnum>;

export const EmergencyPriorityEnum = z.enum(["CRITICA", "ALTA", "MEDIA", "BAJA"]);
export type EmergencyPriority = z.infer<typeof EmergencyPriorityEnum>;

export const EmergencyStatusEnum = z.enum([
  "RECIBIDA",
  "VALIDANDO",
  "PRIORIZADA",
  "ASIGNADA",
  "EN_ATENCION",
  "RESUELTA",
  "CANCELADA",
]);
export type EmergencyStatus = z.infer<typeof EmergencyStatusEnum>;

/** Mapeo de tipo de emergencia -> prioridad. Es la regla de clasificación (triage) de esta fase. */
export const PRIORITY_BY_TYPE: Record<EmergencyType, EmergencyPriority> = {
  SEARCH_RESCUE_MEDICAL: "CRITICA",
  SHELTER_TEMPORARY_HOUSING: "ALTA",
  BASIC_SUPPLIES_HUMANITARIAN_AID: "MEDIA",
  STRUCTURAL_DAMAGE_ASSESSMENT: "BAJA",
};

/** Flujo válido de estados. Usado para rechazar transiciones que no tienen sentido. */
export const STATUS_FLOW: EmergencyStatus[] = [
  "RECIBIDA",
  "VALIDANDO",
  "PRIORIZADA",
  "ASIGNADA",
  "EN_ATENCION",
  "RESUELTA",
];

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

export interface Emergency {
  id: string;
  tipo: EmergencyType;
  prioridad: EmergencyPriority;
  ciudad: City;
  descripcion: string;
  latitud: number;
  longitud: number;
  estado: EmergencyStatus;
  fechaCreacion: string;
  fechaActualizacion: string;
  datosEspecificos: CreateEmergencyInput["datosEspecificos"];
}

export const ListEmergenciesQuerySchema = z.object({
  ciudad: CityEnum.optional(),
  prioridad: EmergencyPriorityEnum.optional(),
  estado: EmergencyStatusEnum.optional(),
});
