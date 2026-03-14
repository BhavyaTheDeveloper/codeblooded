import type { Request, Response, NextFunction } from "express";
import { sendSuccess, sendError } from "../../shared/utils/responses.js";
import * as productsService from "./products.service.js";
import {
  createProductSchema,
  updateProductSchema,
  listProductsQuerySchema,
} from "./products.validation.js";

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = createProductSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0]?.message ?? "Validation failed", 400);
      return;
    }
    const product = await productsService.createProduct(parsed.data);
    sendSuccess(res, product, 201);
  } catch (err) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = listProductsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0]?.message ?? "Validation failed", 400);
      return;
    }
    const result = await productsService.listProducts(parsed.data);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const product = await productsService.getProductById(req.params.id);
    sendSuccess(res, product);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = updateProductSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0]?.message ?? "Validation failed", 400);
      return;
    }
    const product = await productsService.updateProduct(req.params.id, parsed.data);
    sendSuccess(res, product);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await productsService.deleteProduct(req.params.id);
    sendSuccess(res, { deleted: true });
  } catch (err) {
    next(err);
  }
}
