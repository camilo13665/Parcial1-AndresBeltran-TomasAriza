import { ConflictError } from "../errors";

/**
 * Fuente única de verdad de los valores de dominio: el DTO de la capa
 * interface (Zod, en interface/dto) construye sus enums a partir de estas
 * tuplas, nunca al revés — el dominio no depende de la capa de validación.
 */
export const CITIES = ["CHOCO", "PEREIRA", "CALI", "MANIZALES"] as const;
export type City = (typeof CITIES)[number];

export const EMERGENCY_TYPES = [
  "SEARCH_RESCUE_MEDICAL",
  "SHELTER_TEMPORARY_HOUSING",
  "BASIC_SUPPLIES_HUMANITARIAN_AID",
  "STRUCTURAL_DAMAGE_ASSESSMENT",
] as const;
export type EmergencyType = (typeof EMERGENCY_TYPES)[number];

export const EMERGENCY_PRIORITIES = ["CRITICA", "ALTA", "MEDIA", "BAJA"] as const;
export type EmergencyPriority = (typeof EMERGENCY_PRIORITIES)[number];

export const EMERGENCY_STATUSES = [
  "RECIBIDA",
  "VALIDANDO",
  "PRIORIZADA",
  "ASIGNADA",
  "EN_ATENCION",
  "RESUELTA",
  "CANCELADA",
] as const;
export type EmergencyStatus = (typeof EMERGENCY_STATUSES)[number];

/** Regla de clasificación (triage): tipo de emergencia -> prioridad. */
const PRIORITY_BY_TYPE: Record<EmergencyType, EmergencyPriority> = {
  SEARCH_RESCUE_MEDICAL: "CRITICA",
  SHELTER_TEMPORARY_HOUSING: "ALTA",
  BASIC_SUPPLIES_HUMANITARIAN_AID: "MEDIA",
  STRUCTURAL_DAMAGE_ASSESSMENT: "BAJA",
};

/** Flujo de estados válido — el orden importa, define qué transición es la "siguiente". */
const STATUS_FLOW: EmergencyStatus[] = [
  "RECIBIDA",
  "VALIDANDO",
  "PRIORIZADA",
  "ASIGNADA",
  "EN_ATENCION",
  "RESUELTA",
];

export interface EmergencyProps {
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
  datosEspecificos: unknown;
}

export interface NewEmergencyInput {
  tipo: EmergencyType;
  ciudad: City;
  descripcion: string;
  latitud: number;
  longitud: number;
  datosEspecificos: unknown;
}

/**
 * Entidad de dominio: encapsula tanto los datos de una emergencia como las
 * reglas de negocio que antes vivían sueltas en el service (clasificación de
 * prioridad, validación de transición de estado). Es inmutable — cualquier
 * cambio de estado produce una nueva instancia (`withStatus`).
 */
export class Emergency {
  readonly id: string;
  readonly tipo: EmergencyType;
  readonly prioridad: EmergencyPriority;
  readonly ciudad: City;
  readonly descripcion: string;
  readonly latitud: number;
  readonly longitud: number;
  readonly estado: EmergencyStatus;
  readonly fechaCreacion: string;
  readonly fechaActualizacion: string;
  readonly datosEspecificos: unknown;

  constructor(props: EmergencyProps) {
    this.id = props.id;
    this.tipo = props.tipo;
    this.prioridad = props.prioridad;
    this.ciudad = props.ciudad;
    this.descripcion = props.descripcion;
    this.latitud = props.latitud;
    this.longitud = props.longitud;
    this.estado = props.estado;
    this.fechaCreacion = props.fechaCreacion;
    this.fechaActualizacion = props.fechaActualizacion;
    this.datosEspecificos = props.datosEspecificos;
  }

  static create(input: NewEmergencyInput, id: string, timestamp: string): Emergency {
    return new Emergency({
      id,
      tipo: input.tipo,
      prioridad: PRIORITY_BY_TYPE[input.tipo],
      ciudad: input.ciudad,
      descripcion: input.descripcion,
      latitud: input.latitud,
      longitud: input.longitud,
      estado: "RECIBIDA",
      fechaCreacion: timestamp,
      fechaActualizacion: timestamp,
      datosEspecificos: input.datosEspecificos,
    });
  }

  isFinal(): boolean {
    return this.estado === "RESUELTA" || this.estado === "CANCELADA";
  }

  private nextValidStatus(): EmergencyStatus | undefined {
    return STATUS_FLOW[STATUS_FLOW.indexOf(this.estado) + 1];
  }

  /** Lanza ConflictError si la transición no es válida — antes vivía en el service. */
  assertCanTransitionTo(nuevoEstado: EmergencyStatus): void {
    if (this.isFinal()) {
      throw new ConflictError(`La emergencia ${this.id} ya está en estado final (${this.estado})`);
    }
    if (nuevoEstado !== "CANCELADA" && nuevoEstado !== this.nextValidStatus()) {
      throw new ConflictError(
        `Transición inválida: ${this.estado} -> ${nuevoEstado}. El siguiente estado válido es ${this.nextValidStatus() ?? "ninguno"}.`,
      );
    }
  }

  withStatus(nuevoEstado: EmergencyStatus, timestamp: string): Emergency {
    return new Emergency({ ...this, estado: nuevoEstado, fechaActualizacion: timestamp });
  }
}
