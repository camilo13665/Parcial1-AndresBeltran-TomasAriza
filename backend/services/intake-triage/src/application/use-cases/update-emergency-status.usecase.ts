import { Emergency, EmergencyStatus } from "../../domain/entities/emergency.entity";
import { NotFoundError } from "../../domain/errors";
import { DispatchGateway } from "../../domain/ports/dispatch-gateway.port";
import { NotificationGateway } from "../../domain/ports/notification-gateway.port";
import { EmergencyRepository } from "../../domain/repositories/emergency.repository";

/**
 * Orquesta la transición de estado y sus efectos colaterales — antes esta
 * política vivía en el controller HTTP. "Best effort" con await: en Lambda
 * el proceso se congela apenas se devuelve la respuesta, así que una llamada
 * fire-and-forget puede quedar a medio terminar. Los gateways ya atrapan sus
 * propios errores y tienen timeout de 3s, así que esperar su resultado no
 * rompe la respuesta principal si el otro servicio falla.
 */
export class UpdateEmergencyStatusUseCase {
  constructor(
    private readonly repository: EmergencyRepository,
    private readonly notificationGateway: NotificationGateway,
    private readonly dispatchGateway: DispatchGateway,
  ) {}

  async execute(id: string, nuevoEstado: EmergencyStatus): Promise<Emergency> {
    const current = await this.repository.findById(id);
    if (!current) throw new NotFoundError(`No existe una emergencia con id ${id}`);

    current.assertCanTransitionTo(nuevoEstado);
    const estadoAnterior = current.estado;
    const updated = await this.repository.update(current.withStatus(nuevoEstado, new Date().toISOString()));

    await this.notificationGateway.notifyStatusChange(updated.id, estadoAnterior, updated.estado);
    if (updated.isFinal()) {
      await this.dispatchGateway.releaseResources(updated.id);
    }

    return updated;
  }
}
