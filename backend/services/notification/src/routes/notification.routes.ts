import type { FastifyInstance } from "fastify";
import { createNotification, getNotification, listNotifications } from "../controllers/notification.controller";

export async function notificationRoutes(app: FastifyInstance) {
  app.post("/notifications", createNotification);
  app.get("/notifications", listNotifications);
  app.get("/notifications/:id", getNotification);
}
