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

  if (isLoading) return <p className="text-slate-500">Loading…</p>;
  if (error) return <p className="text-red-600">Failed to load dashboard</p>;

  const kpis = [
    { label: "Products in stock", value: data?.totalProductsInStock ?? 0, to: "/inventory" },
    { label: "Total quantity", value: data?.totalQuantityInStock ?? 0 },
    { label: "Low stock items", value: data?.lowStockItemsCount ?? 0, to: "/inventory", alert: (data?.lowStockItemsCount ?? 0) > 0 },
    { label: "Pending receipts", value: data?.pendingReceiptsCount ?? 0, to: "/receipts" },
    { label: "Pending deliveries", value: data?.pendingDeliveriesCount ?? 0, to: "/deliveries" },
    { label: "Pending transfers", value: data?.pendingTransfersCount ?? 0, to: "/transfers" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className={k.alert ? "border-amber-200 bg-amber-50/50" : ""}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">{k.label}</span>
              {k.to ? (
                <Link to={k.to} className="text-lg font-semibold text-slate-800 hover:underline">
                  {k.value}
                </Link>
              ) : (
                <span className="text-lg font-semibold text-slate-800">{k.value}</span>
              )}
            </div>
          </Card>
        ))}
      </div>
      {data?.lowStockItems && data.lowStockItems.length > 0 && (
        <Card title="Low stock items">
          <ul className="space-y-1 text-sm">
            {data.lowStockItems.map((item) => (
              <li key={item.productId} className="flex justify-between">
                <span>{item.sku} – {item.name}</span>
                <span className="text-amber-600">{item.currentStock} / {item.minStock} min</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
