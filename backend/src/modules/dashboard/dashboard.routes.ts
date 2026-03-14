import { Router } from "express";
import { authMiddleware } from "../../shared/middleware/auth.middleware.js";
import * as dashboardController from "./dashboard.controller.js";

export const dashboardRoutes = Router();

dashboardRoutes.use(authMiddleware);

dashboardRoutes.get("/kpis", dashboardController.getKpis);
dashboardRoutes.get("/activities", dashboardController.getRecentActivities);
