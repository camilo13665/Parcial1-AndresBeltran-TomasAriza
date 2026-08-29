import type { FastifyInstance } from "fastify";
import { loginAdmin, verifyAdmin } from "./admin.controller";

export async function adminRoutes(app: FastifyInstance) {
  app.post("/admin/login", loginAdmin);
  app.get("/admin/session", verifyAdmin);
}
