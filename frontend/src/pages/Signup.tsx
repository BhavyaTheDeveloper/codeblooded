import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signup(email, password, name || undefined);
    setLoading(false);
    if (res.ok) navigate("/", { replace: true });
    else setError(res.error ?? "Sign up failed");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas">
      <div className="w-full max-w-sm bg-card border-[3px] border-dark rounded-[12px] shadow-[8px_8px_0px_0px_var(--color-dark)] p-8">
        <h1 className="text-2xl font-bold text-dark uppercase tracking-wide mb-6">Sign up</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm font-bold text-primary uppercase">{error}</p>}
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
            placeholder="Name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 border-[3px] border-dark rounded-[8px] bg-white focus:bg-[#fefce8] focus:outline-none focus:-translate-y-[2px] focus:-translate-x-[2px] focus:shadow-[4px_4px_0px_0px_var(--color-dark)] transition-all duration-200 placeholder-muted font-bold"
          />
          <input
            type="password"
            placeholder="Password (min 8)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border-[3px] border-dark rounded-[8px] bg-white focus:bg-[#fefce8] focus:outline-none focus:-translate-y-[2px] focus:-translate-x-[2px] focus:shadow-[4px_4px_0px_0px_var(--color-dark)] transition-all duration-200 placeholder-muted font-bold"
            minLength={8}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-dark text-white font-bold uppercase border-[3px] border-dark rounded-[8px] hover:bg-primary-dark hover:text-white hover:-translate-y-[2px] hover:-translate-x-[2px] shadow-[2px_2px_0px_0px_var(--color-dark)] hover:shadow-[4px_4px_0px_0px_var(--color-dark)] disabled:opacity-50 transition-all duration-200"
          >
            {loading ? "Creating account…" : "Sign up"}
          </button>
        </form>
        <p className="mt-6 text-sm font-bold text-muted uppercase">
          Already have an account? <Link to="/login" className="text-dark hover:text-primary underline transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
