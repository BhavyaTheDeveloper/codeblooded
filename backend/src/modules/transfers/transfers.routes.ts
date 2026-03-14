import { Router } from "express";
import { authMiddleware } from "../../shared/middleware/auth.middleware.js";
import * as transfersController from "./transfers.controller.js";

export const transferRoutes = Router();

transferRoutes.use(authMiddleware);

transferRoutes.get("/", transfersController.list);
transferRoutes.post("/", transfersController.create);
transferRoutes.get("/:id", transfersController.getById);
transferRoutes.patch("/:id", transfersController.update);
transferRoutes.post("/:id/validate", transfersController.validateTransfer);
