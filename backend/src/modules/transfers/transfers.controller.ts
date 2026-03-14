import type { Request, Response, NextFunction } from "express";
import { sendSuccess, sendError } from "../../shared/utils/responses.js";
import * as transfersService from "./transfers.service.js";
import { createTransferSchema, updateTransferSchema } from "./transfers.validation.js";
import type { AuthRequest } from "../../shared/types/common.js";

export async function create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = createTransferSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0]?.message ?? "Validation failed", 400);
      return;
    }
    const userId = req.user?.userId ?? "";
    const transfer = await transfersService.createTransfer(parsed.data, userId);
    sendSuccess(res, transfer, 201);
  } catch (err) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const fromWarehouseId = typeof req.query.fromWarehouseId === "string" ? req.query.fromWarehouseId : undefined;
    const toWarehouseId = typeof req.query.toWarehouseId === "string" ? req.query.toWarehouseId : undefined;
    const status = typeof req.query.status === "string" ? req.query.status as "DRAFT" | "VALIDATED" : undefined;
    const transfers = await transfersService.listTransfers({ fromWarehouseId, toWarehouseId, status });
    sendSuccess(res, transfers);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const transfer = await transfersService.getTransferById(req.params.id);
    sendSuccess(res, transfer);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = updateTransferSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0]?.message ?? "Validation failed", 400);
      return;
    }
    const transfer = await transfersService.updateTransfer(req.params.id, parsed.data);
    sendSuccess(res, transfer);
  } catch (err) {
    next(err);
  }
}

export async function validateTransfer(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId ?? "";
    const transfer = await transfersService.validateTransfer(req.params.id, userId);
    sendSuccess(res, transfer);
  } catch (err) {
    next(err);
  }
}
