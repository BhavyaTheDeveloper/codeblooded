import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const nav = [
  { to: "/", label: "Dashboard" },
  { to: "/products", label: "Products" },
  { to: "/receipts", label: "Receipts" },
  { to: "/deliveries", label: "Deliveries" },
  { to: "/transfers", label: "Transfers" },
  { to: "/adjustments", label: "Adjustments" },
  { to: "/inventory", label: "Inventory" },
  { to: "/warehouses", label: "Warehouses" },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-56 bg-slate-900 text-white flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <h1 className="font-semibold text-lg">Inventory</h1>
        </div>
        <nav className="flex-1 p-2">
          {nav.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`block px-3 py-2 rounded-md text-sm ${
                location.pathname === to ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-700">
          <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-1 text-xs text-slate-400 hover:text-white"
          >
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
