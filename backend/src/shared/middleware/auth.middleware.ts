import type { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../../config/index.js";
import { sendError } from "../utils/responses.js";
import type { AuthRequest, JwtPayload } from "../types/common.js";

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    sendError(res, "Missing or invalid authorization header", 401, "UNAUTHORIZED");
    return;
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    sendError(res, "Invalid or expired token", 401, "UNAUTHORIZED");
  }
}
