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
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-dark uppercase tracking-widest border-b-[3px] border-dark pb-4">Inventory & Ledger</h1>
      <Card>
        <div className="flex flex-wrap gap-4 items-center">
          <select
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
            className="px-4 py-2 border-[3px] border-dark rounded-[8px] bg-white text-dark font-bold uppercase outline-none focus:bg-[#fefce8] focus:-translate-y-[2px] focus:-translate-x-[2px] shadow-[2px_2px_0px_0px_var(--color-dark)] focus:shadow-[4px_4px_0px_0px_var(--color-dark)] transition-all duration-200 cursor-pointer"
          >
            <option value="">All warehouses</option>
            {whRes?.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setTab("stock")}
              className={`px-4 py-2 border-[3px] border-dark rounded-[8px] font-bold uppercase transition-all duration-200 ${
                tab === "stock"
                  ? "bg-dark text-card translate-x-[2px] translate-y-[2px]"
                  : "bg-card text-dark shadow-[4px_4px_0px_0px_var(--color-dark)] hover:bg-accent hover:-translate-y-[2px] hover:-translate-x-[2px] hover:shadow-[6px_6px_0px_0px_var(--color-dark)]"
              }`}
            >
              Current stock
            </button>
            <button
              type="button"
              onClick={() => setTab("ledger")}
              className={`px-4 py-2 border-[3px] border-dark rounded-[8px] font-bold uppercase transition-all duration-200 ${
                tab === "ledger"
                  ? "bg-dark text-card translate-x-[2px] translate-y-[2px]"
                  : "bg-card text-dark shadow-[4px_4px_0px_0px_var(--color-dark)] hover:bg-accent hover:-translate-y-[2px] hover:-translate-x-[2px] hover:shadow-[6px_6px_0px_0px_var(--color-dark)]"
              }`}
            >
              Ledger
            </button>
          </div>
        </div>
      </Card>
      {tab === "stock" && (
        <Card title="Current stock by location">
          {invLoading && <p className="text-muted font-bold uppercase">Loading…</p>}
          {invError && <p className="text-primary font-bold uppercase">Failed to load</p>}
          {invData && (
            <>
              <DataTable columns={["Product", "Warehouse", "Location", "Quantity"]}>
                {(invData.items as Array<{ id: string; product?: { sku: string; name: string }; warehouse?: { name: string }; location?: { code: string }; quantity: number }>).map((i) => (
                  <tr key={i.id} className="hover:bg-accent transition-colors duration-200">
                    <td className="px-4 py-3 text-sm font-bold uppercase">{i.product?.sku} – {i.product?.name}</td>
                    <td className="px-4 py-3 text-sm font-bold uppercase">{i.warehouse?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-sm font-bold uppercase">{i.location?.code ?? "—"}</td>
                    <td className="px-4 py-3 text-sm font-bold font-mono text-lg">{i.quantity}</td>
                  </tr>
                ))}
              </DataTable>
              <p className="mt-4 text-sm font-bold text-muted uppercase tracking-wider">Total rows: {invData.total}</p>
            </>
          )}
        </Card>
      )}
      {tab === "ledger" && (
        <Card title="Stock ledger (audit trail)">
          {ledgerLoading && <p className="text-muted font-bold uppercase">Loading…</p>}
          {ledgerError && <p className="text-primary font-bold uppercase">Failed to load</p>}
          {ledgerData && (
            <>
              <DataTable columns={["Type", "Product", "Warehouse", "Location", "Delta", "After", "Date"]}>
                {(ledgerData.items as Array<{ id: string; documentType: string; product?: { sku: string }; warehouse?: { name: string }; location?: { code: string }; quantityDelta: number; quantityAfter: number; createdAt: string }>).map((e) => (
                  <tr key={e.id} className="hover:bg-accent transition-colors duration-200">
                    <td className="px-4 py-3 text-sm font-bold uppercase">{e.documentType}</td>
                    <td className="px-4 py-3 text-sm font-bold uppercase">{e.product?.sku ?? "—"}</td>
                    <td className="px-4 py-3 text-sm font-bold uppercase">{e.warehouse?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-sm font-bold uppercase">{e.location?.code ?? "—"}</td>
                    <td className={`px-4 py-3 text-base font-bold font-mono ${e.quantityDelta >= 0 ? "text-success" : "text-primary"}`}>{e.quantityDelta >= 0 ? "+" : ""}{e.quantityDelta}</td>
                    <td className="px-4 py-3 text-base font-bold font-mono">{e.quantityAfter}</td>
                    <td className="px-4 py-3 text-sm font-bold uppercase">{new Date(e.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </DataTable>
              <p className="mt-4 text-sm font-bold text-muted uppercase tracking-wider">Total: {ledgerData.total}</p>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
