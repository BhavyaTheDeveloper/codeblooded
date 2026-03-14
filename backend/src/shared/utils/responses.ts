import type { Response } from "express";
import type { ApiResponse } from "../types/common.js";

export function sendSuccess<T>(res: Response, data: T, status = 200): void {
  const body: ApiResponse<T> = { success: true, data };
  res.status(status).json(body);
}

export function sendError(res: Response, error: string, status = 400, code?: string): void {
  const body: ApiResponse = { success: false, error, code };
  res.status(status).json(body);
}
