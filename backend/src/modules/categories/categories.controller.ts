import type { Request, Response, NextFunction } from "express";
import { sendSuccess, sendError } from "../../shared/utils/responses.js";
import * as categoriesService from "./categories.service.js";
import { createCategorySchema, updateCategorySchema } from "./categories.validation.js";

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = createCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0]?.message ?? "Validation failed", 400);
      return;
    }
    const category = await categoriesService.createCategory(parsed.data);
    sendSuccess(res, category, 201);
  } catch (err) {
    next(err);
  }
}

export async function list(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const categories = await categoriesService.getCategories();
    sendSuccess(res, categories);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const category = await categoriesService.getCategoryById(req.params.id);
    sendSuccess(res, category);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = updateCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0]?.message ?? "Validation failed", 400);
      return;
    }
    const category = await categoriesService.updateCategory(req.params.id, parsed.data);
    sendSuccess(res, category);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await categoriesService.deleteCategory(req.params.id);
    sendSuccess(res, { deleted: true });
  } catch (err) {
    next(err);
  }
}
