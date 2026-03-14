import type { Request, Response, NextFunction } from "express";
import { sendSuccess, sendError } from "../../shared/utils/responses.js";
import * as deliveriesService from "./deliveries.service.js";
import {
  createDeliverySchema,
  updateDeliverySchema,
  updateStatusSchema,
} from "./deliveries.validation.js";
import type { AuthRequest } from "../../shared/types/common.js";

export async function create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = createDeliverySchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0]?.message ?? "Validation failed", 400);
      return;
    }
    const userId = req.user?.userId ?? "";
    const delivery = await deliveriesService.createDelivery(parsed.data, userId);
    sendSuccess(res, delivery, 201);
  } catch (err) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const warehouseId = typeof req.query.warehouseId === "string" ? req.query.warehouseId : undefined;
    const status = typeof req.query.status === "string" ? req.query.status as "DRAFT" | "PICKED" | "PACKED" | "VALIDATED" : undefined;
    const deliveries = await deliveriesService.listDeliveries(warehouseId, status);
    sendSuccess(res, deliveries);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const delivery = await deliveriesService.getDeliveryById(req.params.id);
    sendSuccess(res, delivery);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = updateDeliverySchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0]?.message ?? "Validation failed", 400);
      return;
    }
    const delivery = await deliveriesService.updateDelivery(req.params.id, parsed.data);
    sendSuccess(res, delivery);
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0]?.message ?? "Validation failed", 400);
      return;
    }
    const delivery = await deliveriesService.updateDeliveryStatus(req.params.id, parsed.data.status);
    sendSuccess(res, delivery);
  } catch (err) {
    next(err);
  }
}

export async function validateDelivery(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId ?? "";
    const delivery = await deliveriesService.validateDelivery(req.params.id, userId);
    sendSuccess(res, delivery);
  } catch (err) {
    next(err);
  }
}
