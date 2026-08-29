import { Dispatch, NewDispatchInput } from "../../domain/entities/dispatch.entity";
import { City } from "../../domain/entities/resource.entity";
import { ConflictError, NotFoundError } from "../../domain/errors";
import { EmergencyGateway } from "../../domain/ports/emergency-gateway.port";
import { DispatchRepository } from "../../domain/repositories/dispatch.repository";
import { ResourceRepository } from "../../domain/repositories/resource.repository";

export interface SyncResult {
  ok: boolean;
  mensaje?: string;
}

export interface CreateDispatchResult {
  dispatch: Dispatch;
  sincronizacionIntake: SyncResult;
}

/**
 * Orquesta la creación de un despacho: valida la emergencia remota y los
 * recursos, reserva los recursos, y sincroniza el nuevo estado de la
 * emergencia en Intake & Triage. Antes esta política vivía repartida entre
 * dispatch.service.ts (validaciones) y el controller (nada, ya estaba acá,
 * pero mezclada con acceso directo a Supabase).
 */
export class CreateDispatchUseCase {
  constructor(
    private readonly dispatchRepository: DispatchRepository,
    private readonly resourceRepository: ResourceRepository,
    private readonly emergencyGateway: EmergencyGateway,
  ) {}

  async execute(input: NewDispatchInput, authorization?: string): Promise<CreateDispatchResult> {
    const emergency = await this.emergencyGateway.getEmergency(input.emergenciaId);
    if (emergency.estado === "RESUELTA" || emergency.estado === "CANCELADA") {
      throw new ConflictError(`La emergencia ${input.emergenciaId} está en estado final`);
    }
    if (emergency.estado !== "PRIORIZADA") {
      throw new ConflictError(`La emergencia ${input.emergenciaId} debe estar PRIORIZADA`);
    }

    const resources = await Promise.all(input.recursoIds.map((id) => this.getResourceOrThrow(id)));
    // emergency.ciudad llega como string (Dispatch no comparte el enum City
    // de Intake & Triage — cada servicio es dueño de su contrato).
    for (const resource of resources) {
      resource.assertInCity(emergency.ciudad as City);
      resource.assertAvailable();
    }

    const dispatch = await this.dispatchRepository.create(
      Dispatch.create(input, `DSP-${Date.now()}`, new Date().toISOString()),
    );
    await Promise.all(resources.map((resource) => this.resourceRepository.updateStatus(resource.id, "ASIGNADO")));

    let sincronizacionIntake: SyncResult = { ok: true };
    try {
      await this.emergencyGateway.updateStatus(input.emergenciaId, "ASIGNADA", authorization);
    } catch (err) {
      sincronizacionIntake = { ok: false, mensaje: err instanceof Error ? err.message : "Error de sincronización" };
    }

    return { dispatch, sincronizacionIntake };
  }

  private async getResourceOrThrow(id: string) {
    const resource = await this.resourceRepository.findById(id);
    if (!resource) throw new NotFoundError(`No existe un recurso con id ${id}`);
    return resource;
  }
}
