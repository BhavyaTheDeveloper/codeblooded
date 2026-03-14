import { Router } from "express";
import { authMiddleware } from "../../shared/middleware/auth.middleware.js";
import * as categoriesController from "./categories.controller.js";

export const categoryRoutes = Router();

categoryRoutes.use(authMiddleware);

categoryRoutes.get("/", categoriesController.list);
categoryRoutes.post("/", categoriesController.create);
categoryRoutes.get("/:id", categoriesController.getById);
categoryRoutes.patch("/:id", categoriesController.update);
categoryRoutes.delete("/:id", categoriesController.remove);
