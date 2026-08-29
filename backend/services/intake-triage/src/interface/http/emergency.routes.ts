import type { FastifyInstance } from "fastify";
import {
  createEmergency,
  getEmergency,
  getStats,
  listEmergencies,
  updateEmergencyStatus,
} from "./emergency.controller";
import { requireAdmin } from "./admin.controller";

export async function emergencyRoutes(app: FastifyInstance) {
  app.post("/emergencies", createEmergency);
  app.get("/emergencies", listEmergencies);
  app.get("/emergencies/stats", getStats);
  app.get("/emergencies/:id", getEmergency);
  app.patch<{ Params: { id: string } }>("/emergencies/:id/status", { preHandler: requireAdmin }, updateEmergencyStatus);
}
