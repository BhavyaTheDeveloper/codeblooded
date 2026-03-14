import type { Request, Response, NextFunction } from "express";
import { sendSuccess, sendError } from "../../shared/utils/responses.js";
import * as warehousesService from "./warehouses.service.js";
import {
  createWarehouseSchema,
  updateWarehouseSchema,
  createLocationSchema,
  updateLocationSchema,
} from "./warehouses.validation.js";

export async function createWarehouse(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = createWarehouseSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0]?.message ?? "Validation failed", 400);
      return;
    }
    const warehouse = await warehousesService.createWarehouse(parsed.data);
    sendSuccess(res, warehouse, 201);
  } catch (err) {
    next(err);
  }
}

export async function listWarehouses(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const warehouses = await warehousesService.listWarehouses();
    sendSuccess(res, warehouses);
  } catch (err) {
    next(err);
  }
}

export async function getWarehouseById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const warehouse = await warehousesService.getWarehouseById(req.params.id);
    sendSuccess(res, warehouse);
  } catch (err) {
    next(err);
  }
}

export async function updateWarehouse(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = updateWarehouseSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0]?.message ?? "Validation failed", 400);
      return;
    }
    const warehouse = await warehousesService.updateWarehouse(req.params.id, parsed.data);
    sendSuccess(res, warehouse);
  } catch (err) {
    next(err);
  }
}

export async function deleteWarehouse(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await warehousesService.deleteWarehouse(req.params.id);
    sendSuccess(res, { deleted: true });
  } catch (err) {
    next(err);
  }
}

export async function createLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = createLocationSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0]?.message ?? "Validation failed", 400);
      return;
    }
    const location = await warehousesService.createLocation(req.params.id, parsed.data);
    sendSuccess(res, location, 201);
  } catch (err) {
    next(err);
  }
}

export async function listLocations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const locations = await warehousesService.listLocations(req.params.id);
    sendSuccess(res, locations);
  } catch (err) {
    next(err);
  }
}

export async function updateLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = updateLocationSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0]?.message ?? "Validation failed", 400);
      return;
    }
    const location = await warehousesService.updateLocation(
      req.params.id,
      req.params.locationId,
      parsed.data
    );
    sendSuccess(res, location);
  } catch (err) {
    next(err);
  }
}

export async function deleteLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await warehousesService.deleteLocation(req.params.id, req.params.locationId);
    sendSuccess(res, { deleted: true });
  } catch (err) {
    next(err);
  }
}
