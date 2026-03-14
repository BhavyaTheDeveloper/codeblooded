import type { Request, Response, NextFunction } from "express";
import { sendSuccess, sendError } from "../../shared/utils/responses.js";
import * as dashboardService from "./dashboard.service.js";

const documentTypeSchema = ["RECEIPT", "DELIVERY", "TRANSFER", "ADJUSTMENT"] as const;

export async function getKpis(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const kpis = await dashboardService.getKpis();
    sendSuccess(res, kpis);
  } catch (err) {
    next(err);
  }
}

export async function getRecentActivities(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const documentType = typeof req.query.documentType === "string" && documentTypeSchema.includes(req.query.documentType as typeof documentTypeSchema[number])
      ? (req.query.documentType as typeof documentTypeSchema[number])
      : undefined;
    const warehouseId = typeof req.query.warehouseId === "string" ? req.query.warehouseId : undefined;
    const limit = typeof req.query.limit === "string" ? parseInt(req.query.limit, 10) : 20;
    const activities = await dashboardService.getRecentActivities({
      documentType,
      warehouseId,
      limit: Number.isFinite(limit) ? limit : 20,
    });
    sendSuccess(res, activities);
  } catch (err) {
    next(err);
  }
}
