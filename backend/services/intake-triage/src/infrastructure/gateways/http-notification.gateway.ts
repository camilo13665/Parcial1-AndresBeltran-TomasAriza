import { EmergencyStatus } from "../../domain/entities/emergency.entity";
import { GatewayResult, NotificationGateway } from "../../domain/ports/notification-gateway.port";

/**
 * Adapter HTTP hacia Notification & Status Broadcast. Intake & Triage no
 * importa lógica de Notification ni comparte su store: cuando una emergencia
 * cambia de estado, se lo informa por HTTP. Es "best effort" — si
 * Notification está caído, la transición de estado en Intake & Triage igual
 * se confirma, pero el intento de sincronización queda reflejado en el
 * resultado para quien llamó al caso de uso.
 */
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL ?? "http://localhost:3004";
const TIMEOUT_MS = 3000;

function timeout<T>(promise: Promise<T>, milliseconds: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Tiempo de espera agotado")), milliseconds)),
  ]);
}

export class HttpNotificationGateway implements NotificationGateway {
  async notifyStatusChange(
    emergenciaId: string,
    estadoAnterior: EmergencyStatus,
    estadoNuevo: EmergencyStatus,
  ): Promise<GatewayResult> {
    try {
      const response = await timeout(
        fetch(`${NOTIFICATION_SERVICE_URL}/notifications`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emergenciaId, estadoAnterior, estadoNuevo }),
        }),
        TIMEOUT_MS,
      );

      if (!response.ok) {
        return { ok: false, mensaje: `Notification respondió con estado ${response.status}` };
      }
      return { ok: true };
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      return { ok: false, mensaje: `No se pudo conectar con Notification & Status Broadcast: ${reason}` };
    }
  }
}
