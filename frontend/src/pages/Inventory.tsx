import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { inventoryApi, warehousesApi } from "../api/endpoints";
import { Card } from "../components/Card";
import { DataTable } from "../components/DataTable";

export function Inventory() {
  const [warehouseId, setWarehouseId] = useState("");
  const [tab, setTab] = useState<"stock" | "ledger">("stock");
  const { data: whRes } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const r = await warehousesApi.list();
      if (!r.success) throw new Error(r.error);
      return r.data;
    },
  });
  const { data: invData, isLoading: invLoading, error: invError } = useQuery({
    queryKey: ["inventory", warehouseId],
    queryFn: async () => {
      const r = await inventoryApi.list({ warehouseId: warehouseId || undefined, take: 100 });
      if (!r.success) throw new Error(r.error);
      return r.data;
    },
    enabled: tab === "stock",
  });
  const { data: ledgerData, isLoading: ledgerLoading, error: ledgerError } = useQuery({
    queryKey: ["ledger", warehouseId],
    queryFn: async () => {
      const r = await inventoryApi.ledger({ warehouseId: warehouseId || undefined, take: 50 });
      if (!r.success) throw new Error(r.error);
      return r.data;
    },
    enabled: tab === "ledger",
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-800">Inventory & ledger</h1>
      <Card>
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md"
          >
            <option value="">All warehouses</option>
            {whRes?.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTab("stock")}
              className={`px-3 py-2 rounded-md text-sm ${tab === "stock" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-700"}`}
            >
              Current stock
            </button>
            <button
              type="button"
              onClick={() => setTab("ledger")}
              className={`px-3 py-2 rounded-md text-sm ${tab === "ledger" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-700"}`}
            >
              Ledger
            </button>
          </div>
        </div>
      </Card>
      {tab === "stock" && (
        <Card title="Current stock by location">
          {invLoading && <p className="text-slate-500">Loading…</p>}
          {invError && <p className="text-red-600">Failed to load</p>}
          {invData && (
            <>
              <DataTable columns={["Product", "Warehouse", "Location", "Quantity"]}>
                {(invData.items as Array<{ id: string; product?: { sku: string; name: string }; warehouse?: { name: string }; location?: { code: string }; quantity: number }>).map((i) => (
                  <tr key={i.id}>
                    <td className="px-4 py-2 text-sm">{i.product?.sku} – {i.product?.name}</td>
                    <td className="px-4 py-2 text-sm">{i.warehouse?.name ?? "—"}</td>
                    <td className="px-4 py-2 text-sm">{i.location?.code ?? "—"}</td>
                    <td className="px-4 py-2 text-sm font-mono">{i.quantity}</td>
                  </tr>
                ))}
              </DataTable>
              <p className="mt-2 text-sm text-slate-500">Total rows: {invData.total}</p>
            </>
          )}
        </Card>
      )}
      {tab === "ledger" && (
        <Card title="Stock ledger (audit trail)">
          {ledgerLoading && <p className="text-slate-500">Loading…</p>}
          {ledgerError && <p className="text-red-600">Failed to load</p>}
          {ledgerData && (
            <>
              <DataTable columns={["Type", "Product", "Warehouse", "Location", "Delta", "After", "Date"]}>
                {(ledgerData.items as Array<{ id: string; documentType: string; product?: { sku: string }; warehouse?: { name: string }; location?: { code: string }; quantityDelta: number; quantityAfter: number; createdAt: string }>).map((e) => (
                  <tr key={e.id}>
                    <td className="px-4 py-2 text-sm">{e.documentType}</td>
                    <td className="px-4 py-2 text-sm">{e.product?.sku ?? "—"}</td>
                    <td className="px-4 py-2 text-sm">{e.warehouse?.name ?? "—"}</td>
                    <td className="px-4 py-2 text-sm">{e.location?.code ?? "—"}</td>
                    <td className={`px-4 py-2 text-sm font-mono ${e.quantityDelta >= 0 ? "text-green-600" : "text-red-600"}`}>{e.quantityDelta >= 0 ? "+" : ""}{e.quantityDelta}</td>
                    <td className="px-4 py-2 text-sm font-mono">{e.quantityAfter}</td>
                    <td className="px-4 py-2 text-sm">{new Date(e.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </DataTable>
              <p className="mt-2 text-sm text-slate-500">Total: {ledgerData.total}</p>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
