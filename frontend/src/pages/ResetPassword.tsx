import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/endpoints";

export function ResetPassword() {
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    const res = await authApi.resetPassword({ email, otpCode, newPassword });
    setLoading(false);
    if (!res.success) {
      setError(res.error ?? "Failed to reset password");
    } else {
      setMessage("Password reset successful. You can now sign in.");
      setTimeout(() => navigate("/login"), 1200);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas">
      <div className="w-full max-w-sm bg-card border-[3px] border-dark rounded-[12px] shadow-[8px_8px_0px_0px_var(--color-dark)] p-8">
        <h1 className="text-2xl font-bold text-dark uppercase tracking-wide mb-6">Reset password</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm font-bold text-primary uppercase">{error}</p>}
          {message && <p className="text-sm font-bold text-green-700 uppercase">{message}</p>}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border-[3px] border-dark rounded-[8px] bg-white focus:bg-[#fefce8] focus:outline-none focus:-translate-y-[2px] focus:-translate-x-[2px] focus:shadow-[4px_4px_0px_0px_var(--color-dark)] transition-all duration-200 placeholder-muted font-bold"
            required
          />
          <input
            type="text"
            placeholder="OTP code"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            className="w-full px-4 py-3 border-[3px] border-dark rounded-[8px] bg-white focus:bg-[#fefce8] focus:outline-none focus:-translate-y-[2px] focus:-translate-x-[2px] focus:shadow-[4px_4px_0px_0px_var(--color-dark)] transition-all duration-200 placeholder-muted font-bold"
            required
          />
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-3 border-[3px] border-dark rounded-[8px] bg-white focus:bg-[#fefce8] focus:outline-none focus:-translate-y-[2px] focus:-translate-x-[2px] focus:shadow-[4px_4px_0px_0px_var(--color-dark)] transition-all duration-200 placeholder-muted font-bold"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-dark text-white font-bold uppercase border-[3px] border-dark rounded-[8px] hover:bg-primary-dark hover:text-white hover:-translate-y-[2px] hover:-translate-x-[2px] shadow-[2px_2px_0px_0px_var(--color-dark)] hover:shadow-[4px_4px_0px_0px_var(--color-dark)] disabled:opacity-50 transition-all duration-200"
          >
            {loading ? "Resetting…" : "Reset password"}
          </button>
        </form>
        <p className="mt-6 text-sm font-bold text-muted uppercase">
          Back to{" "}
          <Link to="/login" className="text-dark hover:text-primary underline transition-colors">
            sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

