import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma.js";
import { config } from "../../config/index.js";
import type { SignupInput, LoginInput, ForgotPasswordInput, ResetPasswordInput } from "./auth.validation.js";
import type { AuthResult } from "./auth.types.js";

const SALT_ROUNDS = 10;
const OTP_EXPIRY_MINUTES = 15;

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function signup(input: SignupInput): Promise<AuthResult> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw Object.assign(new Error("Email already registered"), { status: 400, code: "EMAIL_EXISTS" });
  }
  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      name: input.name ?? null,
    },
  });
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
  );
  return {
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    token,
    expiresIn: config.jwt.expiresIn,
  };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw Object.assign(new Error("Invalid email or password"), { status: 401, code: "INVALID_CREDENTIALS" });
  }
  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw Object.assign(new Error("Invalid email or password"), { status: 401, code: "INVALID_CREDENTIALS" });
  }
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
  );
  return {
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    token,
    expiresIn: config.jwt.expiresIn,
  };
}

export async function forgotPassword(input: ForgotPasswordInput): Promise<{ message: string }> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    return { message: "If the email exists, a reset code has been sent." };
  }
  const otpCode = generateOtp();
  const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  await prisma.user.update({
    where: { id: user.id },
    data: { otpCode, otpExpiresAt },
  });
  console.log(`[DEV] OTP for ${user.email}: ${otpCode}`);
  return { message: "If the email exists, a reset code has been sent." };
}

export async function resetPassword(input: ResetPasswordInput): Promise<{ message: string }> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !user.otpCode || !user.otpExpiresAt) {
    throw Object.assign(new Error("Invalid or expired reset code"), { status: 400, code: "INVALID_OTP" });
  }
  if (user.otpCode !== input.otpCode) {
    throw Object.assign(new Error("Invalid or expired reset code"), { status: 400, code: "INVALID_OTP" });
  }
  if (new Date() > user.otpExpiresAt) {
    throw Object.assign(new Error("Invalid or expired reset code"), { status: 400, code: "INVALID_OTP" });
  }
  const passwordHash = await bcrypt.hash(input.newPassword, SALT_ROUNDS);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, otpCode: null, otpExpiresAt: null },
  });
  return { message: "Password has been reset successfully." };
}
