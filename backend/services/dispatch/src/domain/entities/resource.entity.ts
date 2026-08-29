import { ConflictError } from "../errors";

/** Fuente única de verdad de los enums — el DTO de interface/dto los deriva de aquí. */
export const CITIES = ["CHOCO", "PEREIRA", "CALI", "MANIZALES"] as const;
export type City = (typeof CITIES)[number];

export const RESOURCE_TYPES = ["BOMBEROS", "CRUZ_ROJA", "DEFENSA_CIVIL", "UNGRD", "MEDICO", "RESCATE"] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

export const RESOURCE_STATUSES = ["DISPONIBLE", "ASIGNADO", "EN_RUTA", "OCUPADO", "INACTIVO"] as const;
export type ResourceStatus = (typeof RESOURCE_STATUSES)[number];

export interface ResourceProps {
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

export interface NewResourceInput {
  tipo: ResourceType;
  organismo: string;
  ciudad: City;
  estado: ResourceStatus;
  latitud?: number;
  longitud?: number;
}

/** Recurso de un organismo de socorro. Encapsula las invariantes que antes vivían sueltas en dispatch.service.ts. */
export class Resource {
  readonly id: string;
  readonly tipo: ResourceType;
  readonly organismo: string;
  readonly ciudad: City;
  readonly estado: ResourceStatus;
  readonly latitud?: number;
  readonly longitud?: number;
  readonly fechaCreacion: string;
  readonly fechaActualizacion: string;

  constructor(props: ResourceProps) {
    this.id = props.id;
    this.tipo = props.tipo;
    this.organismo = props.organismo;
    this.ciudad = props.ciudad;
    this.estado = props.estado;
    this.latitud = props.latitud;
    this.longitud = props.longitud;
    this.fechaCreacion = props.fechaCreacion;
    this.fechaActualizacion = props.fechaActualizacion;
  }

  static create(input: NewResourceInput, id: string, timestamp: string): Resource {
    return new Resource({
      id,
      tipo: input.tipo,
      organismo: input.organismo,
      ciudad: input.ciudad,
      estado: input.estado,
      latitud: input.latitud,
      longitud: input.longitud,
      fechaCreacion: timestamp,
      fechaActualizacion: timestamp,
    });
  }

  /** Lanza ConflictError si el recurso no pertenece a la ciudad dada — regla de asignación de despachos. */
  assertInCity(ciudad: City): void {
    if (this.ciudad !== ciudad) {
      throw new ConflictError("Los recursos deben pertenecer a la ciudad de la emergencia");
    }
  }

  /** Lanza ConflictError si el recurso no está disponible — regla de asignación de despachos. */
  assertAvailable(): void {
    if (this.estado !== "DISPONIBLE") {
      throw new ConflictError("Todos los recursos deben estar disponibles");
    }
  }
}

/** Proyección de un recurso con su distancia a un punto — resultado de la búsqueda por proximidad (PostGIS). */
export interface NearbyResourceMatch {
  id: string;
  tipo: ResourceType;
  organismo: string;
  ciudad: City;
  estado: ResourceStatus;
  distanciaMetros: number;
}
