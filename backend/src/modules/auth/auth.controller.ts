import type { Request, Response, NextFunction } from "express";
import { sendSuccess, sendError } from "../../shared/utils/responses.js";
import * as authService from "./auth.service.js";
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./auth.validation.js";

export async function signup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0]?.message ?? "Validation failed", 400);
      return;
    }
    const result = await authService.signup(parsed.data);
    sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0]?.message ?? "Validation failed", 400);
      return;
    }
    const result = await authService.login(parsed.data);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0]?.message ?? "Validation failed", 400);
      return;
    }
    const result = await authService.forgotPassword(parsed.data);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0]?.message ?? "Validation failed", 400);
      return;
    }
    const result = await authService.resetPassword(parsed.data);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}
