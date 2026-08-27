import type { FastifyInstance } from "fastify";
import { aggregateZones, listZones, nearestZone, zoneStats } from "../controllers/zone.controller";

export async function zoneRoutes(app: FastifyInstance) {
  app.get("/zones", listZones);
  app.get("/zones/stats", zoneStats);
  app.post("/zones/aggregate", aggregateZones);
  app.post("/zones/nearest", nearestZone);
}
