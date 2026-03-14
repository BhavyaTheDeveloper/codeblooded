import type { Request } from "express";

export interface JwtPayload {
  userId: string;
  email: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export type ApiResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };
