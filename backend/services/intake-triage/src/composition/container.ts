import { CreateEmergencyUseCase } from "../application/use-cases/create-emergency.usecase";
import { GetEmergencyStatsUseCase } from "../application/use-cases/get-emergency-stats.usecase";
import { GetEmergencyUseCase } from "../application/use-cases/get-emergency.usecase";
import { ListEmergenciesUseCase } from "../application/use-cases/list-emergencies.usecase";
import { UpdateEmergencyStatusUseCase } from "../application/use-cases/update-emergency-status.usecase";
import { HttpDispatchGateway } from "../infrastructure/gateways/http-dispatch.gateway";
import { HttpNotificationGateway } from "../infrastructure/gateways/http-notification.gateway";
import { PostgrestClient } from "../infrastructure/persistence/postgrest-client";
import { SupabaseEmergencyRepository } from "../infrastructure/persistence/supabase-emergency.repository";

/**
 * Composition root: el único lugar del servicio que conoce las clases
 * concretas de infraestructura. Todo lo demás (casos de uso, controllers)
 * depende únicamente de las interfaces de domain/repositories y
 * domain/ports — esto es la Regla de Dependencia de Clean Architecture y la
 * D de SOLID (Dependency Inversion) aplicadas en la práctica.
 */
const postgrestClient = new PostgrestClient();
const emergencyRepository = new SupabaseEmergencyRepository(postgrestClient);
const notificationGateway = new HttpNotificationGateway();
const dispatchGateway = new HttpDispatchGateway();

export const container = {
  createEmergencyUseCase: new CreateEmergencyUseCase(emergencyRepository),
  listEmergenciesUseCase: new ListEmergenciesUseCase(emergencyRepository),
  getEmergencyUseCase: new GetEmergencyUseCase(emergencyRepository),
  updateEmergencyStatusUseCase: new UpdateEmergencyStatusUseCase(
    emergencyRepository,
    notificationGateway,
    dispatchGateway,
  ),
  getEmergencyStatsUseCase: new GetEmergencyStatsUseCase(emergencyRepository),
};
