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
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-md p-6">
        <h1 className="text-xl font-semibold text-slate-800 mb-4">Sign up</h1>
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md"
            required
          />
          <input
            type="text"
            placeholder="Name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md"
          />
          <input
            type="password"
            placeholder="Password (min 8)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md"
            minLength={8}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700 disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Sign up"}
          </button>
        </form>
        <p className="mt-3 text-sm text-slate-500">
          Already have an account? <Link to="/login" className="text-slate-700 underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
