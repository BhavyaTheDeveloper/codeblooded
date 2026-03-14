import type { Request, Response, NextFunction } from "express";
import { sendSuccess, sendError } from "../../shared/utils/responses.js";
import * as adjustmentsService from "./adjustments.service.js";
import { createAdjustmentSchema, updateAdjustmentSchema } from "./adjustments.validation.js";
import type { AuthRequest } from "../../shared/types/common.js";

export async function create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = createAdjustmentSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0]?.message ?? "Validation failed", 400);
      return;
    }
    const userId = req.user?.userId ?? "";
    const adjustment = await adjustmentsService.createAdjustment(parsed.data, userId);
    sendSuccess(res, adjustment, 201);
  } catch (err) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const warehouseId = typeof req.query.warehouseId === "string" ? req.query.warehouseId : undefined;
    const status = typeof req.query.status === "string" ? req.query.status as "DRAFT" | "VALIDATED" : undefined;
    const adjustments = await adjustmentsService.listAdjustments(warehouseId, status);
    sendSuccess(res, adjustments);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const adjustment = await adjustmentsService.getAdjustmentById(req.params.id);
    sendSuccess(res, adjustment);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = updateAdjustmentSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0]?.message ?? "Validation failed", 400);
      return;
    }
    const adjustment = await adjustmentsService.updateAdjustment(req.params.id, parsed.data);
    sendSuccess(res, adjustment);
  } catch (err) {
    next(err);
  }
}

export async function validateAdjustment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId ?? "";
    const adjustment = await adjustmentsService.validateAdjustment(req.params.id, userId);
    sendSuccess(res, adjustment);
  } catch (err) {
    next(err);
  }
}
