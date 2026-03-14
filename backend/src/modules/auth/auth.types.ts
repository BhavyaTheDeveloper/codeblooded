export interface SignupBody {
  email: string;
  password: string;
  name?: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface ForgotPasswordBody {
  email: string;
}

export interface ResetPasswordBody {
  email: string;
  otpCode: string;
  newPassword: string;
}

export interface AuthResult {
  user: { id: string; email: string; name: string | null; role: string };
  token: string;
  expiresIn: string;
}
