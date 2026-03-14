import { Router } from "express";
import { authMiddleware } from "../../shared/middleware/auth.middleware.js";
import * as warehousesController from "./warehouses.controller.js";

export const warehouseRoutes = Router();

warehouseRoutes.use(authMiddleware);

warehouseRoutes.get("/", warehousesController.listWarehouses);
warehouseRoutes.post("/", warehousesController.createWarehouse);
warehouseRoutes.get("/:id", warehousesController.getWarehouseById);
warehouseRoutes.patch("/:id", warehousesController.updateWarehouse);
warehouseRoutes.delete("/:id", warehousesController.deleteWarehouse);

warehouseRoutes.get("/:id/locations", warehousesController.listLocations);
warehouseRoutes.post("/:id/locations", warehousesController.createLocation);
warehouseRoutes.patch("/:id/locations/:locationId", warehousesController.updateLocation);
warehouseRoutes.delete("/:id/locations/:locationId", warehousesController.deleteLocation);
