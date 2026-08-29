import { GatewayResult } from "./notification-gateway.port";

/**
 * Puerto hacia Dispatch & Resource Assignment. Igual que NotificationGateway,
 * segregado a la única operación que Intake & Triage necesita de Dispatch.
 */
export interface DispatchGateway {
  releaseResources(emergenciaId: string): Promise<GatewayResult>;
}
