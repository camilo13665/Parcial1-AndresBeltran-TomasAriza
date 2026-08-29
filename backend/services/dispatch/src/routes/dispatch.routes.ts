import type { FastifyInstance } from "fastify";
import { createResource, getNearbyResources, getResource, getResourceStats, listResources, updateResourceStatus } from "../controllers/resource.controller";
import { createDispatch, getDispatch, listDispatches, releaseResources } from "../controllers/dispatch.controller";
import { requireAdmin } from "../admin-auth";

export async function dispatchRoutes(app: FastifyInstance) {
  app.post("/resources", createResource);
  app.get("/resources", listResources);
  app.get("/resources/stats", getResourceStats);
  app.get("/resources/nearby", getNearbyResources);
  app.get("/resources/:id", getResource);
  app.patch("/resources/:id/status", updateResourceStatus);
  app.post("/resources/release", releaseResources);

  app.post("/dispatches", { preHandler: requireAdmin }, createDispatch);
  app.get("/dispatches", listDispatches);
  app.get("/dispatches/:id", getDispatch);
}
