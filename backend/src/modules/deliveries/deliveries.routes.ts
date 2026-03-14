import { Router } from "express";
import { authMiddleware } from "../../shared/middleware/auth.middleware.js";
import * as deliveriesController from "./deliveries.controller.js";

export const deliveryRoutes = Router();

deliveryRoutes.use(authMiddleware);

deliveryRoutes.get("/", deliveriesController.list);
deliveryRoutes.post("/", deliveriesController.create);
deliveryRoutes.get("/:id", deliveriesController.getById);
deliveryRoutes.patch("/:id", deliveriesController.update);
deliveryRoutes.patch("/:id/status", deliveriesController.updateStatus);
deliveryRoutes.post("/:id/validate", deliveriesController.validateDelivery);
