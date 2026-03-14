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
    <div className="flex min-h-screen bg-canvas">
      <aside className="w-64 bg-card text-dark flex flex-col border-r-[3px] border-dark">
        <div className="p-5 border-b-[3px] border-dark bg-accent">
          <h1 className="font-bold text-2xl uppercase tracking-widest text-dark">Inventory</h1>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-3">
          {nav.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`block px-4 py-3 border-[3px] border-dark rounded-[8px] font-bold uppercase transition-all duration-200 ${
                location.pathname === to
                  ? "bg-primary text-white shadow-[4px_4px_0px_0px_var(--color-dark)] -translate-x-[2px] -translate-y-[2px]"
                  : "bg-card text-dark shadow-[2px_2px_0px_0px_var(--color-dark)] hover:bg-accent hover:-translate-y-[2px] hover:-translate-x-[2px] hover:shadow-[4px_4px_0px_0px_var(--color-dark)]"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t-[3px] border-dark bg-canvas">
          <p className="text-sm font-bold text-dark truncate" title={user?.email || ""}>{user?.email}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 w-full px-4 py-2 bg-dark text-white font-bold uppercase border-[3px] border-dark rounded-[8px] hover:bg-primary-dark hover:text-white hover:-translate-y-[2px] hover:-translate-x-[2px] shadow-[2px_2px_0px_0px_var(--color-dark)] hover:shadow-[4px_4px_0px_0px_var(--color-dark)] transition-all duration-200"
          >
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
