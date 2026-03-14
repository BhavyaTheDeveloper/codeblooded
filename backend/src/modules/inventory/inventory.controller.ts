import type { Request, Response, NextFunction } from "express";
import { sendSuccess, sendError } from "../../shared/utils/responses.js";
import * as inventoryService from "./inventory.service.js";
import { listInventoryQuerySchema, listLedgerQuerySchema } from "./inventory.validation.js";

export async function listInventory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = listInventoryQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0]?.message ?? "Validation failed", 400);
      return;
    }
    const result = await inventoryService.listInventory(parsed.data);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function listLedger(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = listLedgerQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0]?.message ?? "Validation failed", 400);
      return;
    }
    const result = await inventoryService.listLedger(parsed.data);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}
