import { Router } from "express";
import * as authController from "./auth.controller.js";

export const authRoutes = Router();

authRoutes.post("/signup", authController.signup);
authRoutes.post("/login", authController.login);
authRoutes.post("/forgot-password", authController.forgotPassword);
authRoutes.post("/reset-password", authController.resetPassword);
