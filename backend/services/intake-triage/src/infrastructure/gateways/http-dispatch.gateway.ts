import { DispatchGateway } from "../../domain/ports/dispatch-gateway.port";
import { GatewayResult } from "../../domain/ports/notification-gateway.port";

/**
 * Adapter HTTP hacia Dispatch & Resource Assignment. Cuando una emergencia
 * llega a un estado final (RESUELTA o CANCELADA), se le avisa a Dispatch
 * para que libere los recursos que tenía asignados. Es "best effort": si
 * Dispatch no responde, la transición de estado se confirma igual — el
 * operador puede liberar el recurso manualmente si hace falta.
 */
const DISPATCH_SERVICE_URL = process.env.DISPATCH_SERVICE_URL ?? "http://localhost:3002";
const TIMEOUT_MS = 3000;

export class HttpDispatchGateway implements DispatchGateway {
  async releaseResources(emergenciaId: string): Promise<GatewayResult> {
    try {
      const response = await fetch(`${DISPATCH_SERVICE_URL}/resources/release`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emergenciaId }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      if (!response.ok) {
        return { ok: false, mensaje: `Dispatch respondió con estado ${response.status}` };
      }
      return { ok: true };
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      return { ok: false, mensaje: `No se pudo conectar con Dispatch & Resource Assignment: ${reason}` };
    }
  }
}
