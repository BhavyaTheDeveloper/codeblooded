import type { Request, Response, NextFunction } from "express";
import { sendSuccess, sendError } from "../../shared/utils/responses.js";
import * as receiptsService from "./receipts.service.js";
import { createReceiptSchema, updateReceiptSchema } from "./receipts.validation.js";
import type { AuthRequest } from "../../shared/types/common.js";

export async function create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = createReceiptSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0]?.message ?? "Validation failed", 400);
      return;
    }
    const userId = req.user?.userId ?? "";
    const receipt = await receiptsService.createReceipt(parsed.data, userId);
    sendSuccess(res, receipt, 201);
  } catch (err) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const warehouseId = typeof req.query.warehouseId === "string" ? req.query.warehouseId : undefined;
    const status = typeof req.query.status === "string" ? (req.query.status as "DRAFT" | "VALIDATED") : undefined;
    const receipts = await receiptsService.listReceipts(warehouseId, status);
    sendSuccess(res, receipts);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const receipt = await receiptsService.getReceiptById(req.params.id);
    sendSuccess(res, receipt);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = updateReceiptSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0]?.message ?? "Validation failed", 400);
      return;
    }
    const receipt = await receiptsService.updateReceipt(req.params.id, parsed.data);
    sendSuccess(res, receipt);
  } catch (err) {
    next(err);
  }
}

export async function validateReceipt(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId ?? "";
    const receipt = await receiptsService.validateReceipt(req.params.id, userId);
    sendSuccess(res, receipt);
  } catch (err) {
    next(err);
  }
}
