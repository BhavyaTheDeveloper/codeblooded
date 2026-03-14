import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../api/endpoints";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    const res = await authApi.forgotPassword({ email });
    setLoading(false);
    if (!res.success) {
      setError(res.error ?? "Failed to send reset code");
    } else {
      setMessage("If the email exists, an OTP code has been sent. Check the server log in development.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas">
      <div className="w-full max-w-sm bg-card border-[3px] border-dark rounded-[12px] shadow-[8px_8px_0px_0px_var(--color-dark)] p-8">
        <h1 className="text-2xl font-bold text-dark uppercase tracking-wide mb-6">Forgot password</h1>
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
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-dark text-white font-bold uppercase border-[3px] border-dark rounded-[8px] hover:bg-primary-dark hover:text-white hover:-translate-y-[2px] hover:-translate-x-[2px] shadow-[2px_2px_0px_0px_var(--color-dark)] hover:shadow-[4px_4px_0px_0px_var(--color-dark)] disabled:opacity-50 transition-all duration-200"
          >
            {loading ? "Sending…" : "Send OTP"}
          </button>
        </form>
        <p className="mt-6 text-sm font-bold text-muted uppercase">
          Remembered it?{" "}
          <Link to="/login" className="text-dark hover:text-primary underline transition-colors">
            Back to sign in
          </Link>
        </p>
        <p className="mt-2 text-sm font-bold text-muted uppercase">
          Already have an OTP?{" "}
          <Link to="/reset-password" className="text-dark hover:text-primary underline transition-colors">
            Enter code
          </Link>
        </p>
      </div>
    </div>
  );
}

