import { Router } from "express";
import { authMiddleware } from "../../shared/middleware/auth.middleware.js";
import * as productsController from "./products.controller.js";

export const productRoutes = Router();

productRoutes.use(authMiddleware);

productRoutes.get("/", productsController.list);
productRoutes.post("/", productsController.create);
productRoutes.get("/:id", productsController.getById);
productRoutes.patch("/:id", productsController.update);
productRoutes.delete("/:id", productsController.remove);
