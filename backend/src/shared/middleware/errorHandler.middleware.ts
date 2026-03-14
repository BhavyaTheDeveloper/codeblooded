import type { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/responses.js";

export function errorHandler(
  err: Error & { status?: number; code?: string },
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = err.status ?? 500;
  const message = err.message ?? "Internal server error";
  const code = err.code;
  sendError(res, message, status, code);
}
