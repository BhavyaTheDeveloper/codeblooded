import { Router } from "express";
import { authMiddleware } from "../../shared/middleware/auth.middleware.js";
import * as inventoryController from "./inventory.controller.js";

export const inventoryRoutes = Router();

inventoryRoutes.use(authMiddleware);

inventoryRoutes.get("/", inventoryController.listInventory);
inventoryRoutes.get("/ledger", inventoryController.listLedger);
