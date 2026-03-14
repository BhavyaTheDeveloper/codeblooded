import { Router } from "express";
import { authMiddleware } from "../../shared/middleware/auth.middleware.js";
import * as receiptsController from "./receipts.controller.js";

export const receiptRoutes = Router();

receiptRoutes.use(authMiddleware);

receiptRoutes.get("/", receiptsController.list);
receiptRoutes.post("/", receiptsController.create);
receiptRoutes.get("/:id", receiptsController.getById);
receiptRoutes.patch("/:id", receiptsController.update);
receiptRoutes.post("/:id/validate", receiptsController.validateReceipt);
