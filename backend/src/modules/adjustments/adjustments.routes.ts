import { Router } from "express";
import { authMiddleware } from "../../shared/middleware/auth.middleware.js";
import * as adjustmentsController from "./adjustments.controller.js";

export const adjustmentRoutes = Router();

adjustmentRoutes.use(authMiddleware);

adjustmentRoutes.get("/", adjustmentsController.list);
adjustmentRoutes.post("/", adjustmentsController.create);
adjustmentRoutes.get("/:id", adjustmentsController.getById);
adjustmentRoutes.patch("/:id", adjustmentsController.update);
adjustmentRoutes.post("/:id/validate", adjustmentsController.validateAdjustment);
