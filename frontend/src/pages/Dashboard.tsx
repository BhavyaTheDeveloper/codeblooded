import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { dashboardApi } from "../api/endpoints";
import { Card } from "../components/Card";

export function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard", "kpis"],
    queryFn: async () => {
      const res = await dashboardApi.kpis();
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
  });

  if (isLoading) return <p className="text-muted font-bold uppercase">Loading…</p>;
  if (error) return <p className="text-primary font-bold uppercase">Failed to load dashboard</p>;

  const kpis = [
    { label: "Products in stock", value: data?.totalProductsInStock ?? 0, to: "/inventory" },
    { label: "Total quantity", value: data?.totalQuantityInStock ?? 0 },
    { label: "Low stock items", value: data?.lowStockItemsCount ?? 0, to: "/inventory", alert: (data?.lowStockItemsCount ?? 0) > 0 },
    { label: "Pending receipts", value: data?.pendingReceiptsCount ?? 0, to: "/receipts" },
    { label: "Pending deliveries", value: data?.pendingDeliveriesCount ?? 0, to: "/deliveries" },
    { label: "Pending transfers", value: data?.pendingTransfersCount ?? 0, to: "/transfers" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-dark uppercase tracking-widest border-b-[3px] border-dark pb-4">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpis.map((k) => (
          <Card key={k.label} className={k.alert ? "bg-accent text-dark" : "bg-card text-dark"}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold uppercase">{k.label}</span>
              {k.to ? (
                <Link to={k.to} className="text-2xl font-bold text-dark underline decoration-[3px] decoration-primary hover:text-primary transition-colors">
                  {k.value}
                </Link>
              ) : (
                <span className="text-2xl font-bold text-dark">{k.value}</span>
              )}
            </div>
          </Card>
        ))}
      </div>
      {data?.lowStockItems && data.lowStockItems.length > 0 && (
        <Card title="Low stock items" className="bg-primary text-white border-dark">
          <ul className="space-y-4 text-sm mt-2">
            {data.lowStockItems.map((item) => (
              <li key={item.productId} className="flex justify-between items-center bg-card text-dark border-[3px] border-dark p-4 rounded-[8px] shadow-[4px_4px_0px_0px_var(--color-dark)] font-bold uppercase">
                <span className="truncate mr-4">{item.sku} <span className="text-muted mx-1">—</span> {item.name}</span>
                <span className="whitespace-nowrap bg-accent text-dark px-3 py-1 border-[3px] border-dark rounded-[6px] shadow-[2px_2px_0px_0px_var(--color-dark)]">{item.currentStock} / {item.minStock} min</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
