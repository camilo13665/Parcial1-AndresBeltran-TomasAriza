export interface DispatchProps {
  id: string;
  emergenciaId: string;
  recursoIds: string[];
  fechaAsignacion: string;
  notas?: string;
}

export interface NewDispatchInput {
  emergenciaId: string;
  recursoIds: string[];
  notas?: string;
}

/** Un despacho asocia una emergencia con uno o más recursos asignados para atenderla. */
export class Dispatch {
  readonly id: string;
  readonly emergenciaId: string;
  readonly recursoIds: string[];
  readonly fechaAsignacion: string;
  readonly notas?: string;

  constructor(props: DispatchProps) {
    this.id = props.id;
    this.emergenciaId = props.emergenciaId;
    this.recursoIds = props.recursoIds;
    this.fechaAsignacion = props.fechaAsignacion;
    this.notas = props.notas;
  }

  static create(input: NewDispatchInput, id: string, timestamp: string): Dispatch {
    return new Dispatch({
      id,
      emergenciaId: input.emergenciaId,
      recursoIds: input.recursoIds,
      notas: input.notas,
      fechaAsignacion: timestamp,
    });
  }
}
