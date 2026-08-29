import { EmergencyStatus } from "../entities/emergency.entity";

export interface GatewayResult {
  ok: boolean;
  mensaje?: string;
}

/**
 * Puerto hacia Notification & Status Broadcast. Interfaz segregada
 * (Interface Segregation): solo declara la única operación que el dominio de
 * Intake & Triage necesita, no un cliente HTTP genérico de Notification.
 */
export interface NotificationGateway {
  notifyStatusChange(
    emergenciaId: string,
    estadoAnterior: EmergencyStatus,
    estadoNuevo: EmergencyStatus,
  ): Promise<GatewayResult>;
}
