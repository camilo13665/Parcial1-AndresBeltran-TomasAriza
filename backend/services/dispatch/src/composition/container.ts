import { CreateDispatchUseCase } from "../application/use-cases/create-dispatch.usecase";
import { CreateResourceUseCase } from "../application/use-cases/create-resource.usecase";
import { FindNearbyResourcesUseCase } from "../application/use-cases/find-nearby-resources.usecase";
import { GetDispatchUseCase } from "../application/use-cases/get-dispatch.usecase";
import { GetResourceStatsUseCase } from "../application/use-cases/get-resource-stats.usecase";
import { GetResourceUseCase } from "../application/use-cases/get-resource.usecase";
import { ListDispatchesUseCase } from "../application/use-cases/list-dispatches.usecase";
import { ListResourcesUseCase } from "../application/use-cases/list-resources.usecase";
import { ReleaseResourcesByEmergencyUseCase } from "../application/use-cases/release-resources-by-emergency.usecase";
import { UpdateResourceStatusUseCase } from "../application/use-cases/update-resource-status.usecase";
import { HttpEmergencyGateway } from "../infrastructure/gateways/http-emergency.gateway";
import { PostgrestClient } from "../infrastructure/persistence/postgrest-client";
import { SupabaseDispatchRepository } from "../infrastructure/persistence/supabase-dispatch.repository";
import { SupabaseResourceRepository } from "../infrastructure/persistence/supabase-resource.repository";

/**
 * Composition root: el único lugar del servicio que conoce las clases
 * concretas de infraestructura (Dependency Inversion aplicada en la práctica).
 */
const postgrestClient = new PostgrestClient();
const resourceRepository = new SupabaseResourceRepository(postgrestClient);
const dispatchRepository = new SupabaseDispatchRepository(postgrestClient);
const emergencyGateway = new HttpEmergencyGateway();

export const container = {
  createResourceUseCase: new CreateResourceUseCase(resourceRepository),
  listResourcesUseCase: new ListResourcesUseCase(resourceRepository),
  getResourceUseCase: new GetResourceUseCase(resourceRepository),
  updateResourceStatusUseCase: new UpdateResourceStatusUseCase(resourceRepository),
  getResourceStatsUseCase: new GetResourceStatsUseCase(resourceRepository),
  findNearbyResourcesUseCase: new FindNearbyResourcesUseCase(resourceRepository),
  createDispatchUseCase: new CreateDispatchUseCase(dispatchRepository, resourceRepository, emergencyGateway),
  listDispatchesUseCase: new ListDispatchesUseCase(dispatchRepository),
  getDispatchUseCase: new GetDispatchUseCase(dispatchRepository),
  releaseResourcesByEmergencyUseCase: new ReleaseResourcesByEmergencyUseCase(dispatchRepository, resourceRepository),
};
