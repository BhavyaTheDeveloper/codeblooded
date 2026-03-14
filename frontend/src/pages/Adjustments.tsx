import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adjustmentsApi, warehousesApi, productsApi } from "../api/endpoints";
import { Card } from "../components/Card";
import { DataTable } from "../components/DataTable";
import { Modal } from "../components/Modal";

type AdjustmentRow = {
  id: string;
  adjustmentNumber: string;
  warehouse?: { name: string };
  reason: string;
  status: string;
  createdAt: string;
};

type WarehouseWithLocations = {
  id: string;
  name: string;
  locations: Array<{ id: string; code: string }>;
};

export function Adjustments() {
  const [warehouseId, setWarehouseId] = useState("");
  const [status, setStatus] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: whRes } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const r = await warehousesApi.list();
      if (!r.success) throw new Error(r.error);
      return r.data as WarehouseWithLocations[];
    },
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["adjustments", warehouseId, status],
    queryFn: async () => {
      const r = await adjustmentsApi.list({ warehouseId: warehouseId || undefined, status: status || undefined });
      if (!r.success) throw new Error(r.error);
      return r.data as AdjustmentRow[];
    },
  });

  const createAdjustment = useMutation({
    mutationFn: async (body: {
      warehouseId: string;
      reason: string;
      notes?: string;
      items: Array<{ productId: string; locationId: string; quantityDelta: number; reason?: string }>;
    }) => {
      const r = await adjustmentsApi.create(body);
      if (!r.success) throw new Error(r.error);
      return r.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adjustments"] });
      setCreateModalOpen(false);
    },
  });

  const validateAdjustment = useMutation({
    mutationFn: async (id: string) => {
      const r = await adjustmentsApi.validate(id);
      if (!r.success) throw new Error(r.error);
      return r.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adjustments"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-dark uppercase tracking-widest border-b-[3px] border-dark pb-4">Stock adjustments</h1>
        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="px-3 py-2 text-sm bg-dark text-white font-bold uppercase border-[3px] border-dark rounded-[8px] hover:-translate-y-[2px] hover:-translate-x-[2px] shadow-[2px_2px_0px_0px_var(--color-dark)] hover:shadow-[4px_4px_0px_0px_var(--color-dark)] transition-all duration-200 rounded-md hover:bg-slate-700"
        >
          Create adjustment
        </button>
      </div>
      <Card>
        <div className="flex flex-wrap gap-3">
          <select
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
            className="px-3 py-2 border-[3px] border-dark rounded-[8px] bg-white text-dark font-bold placeholder-muted focus:outline-none focus:bg-[#fefce8] focus:-translate-y-[2px] focus:-translate-x-[2px] shadow-[2px_2px_0px_0px_var(--color-dark)] focus:shadow-[4px_4px_0px_0px_var(--color-dark)] transition-all duration-200"
          >
            <option value="">All warehouses</option>
            {whRes?.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 border-[3px] border-dark rounded-[8px] bg-white text-dark font-bold placeholder-muted focus:outline-none focus:bg-[#fefce8] focus:-translate-y-[2px] focus:-translate-x-[2px] shadow-[2px_2px_0px_0px_var(--color-dark)] focus:shadow-[4px_4px_0px_0px_var(--color-dark)] transition-all duration-200"
          >
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="VALIDATED">Validated</option>
          </select>
        </div>
      </Card>
      <Card title="Adjustments">
        {isLoading && <p className="text-muted font-bold uppercase">Loading…</p>}
        {error && <p className="text-primary font-bold uppercase">Failed to load</p>}
        {data && (
          <DataTable columns={["Number", "Warehouse", "Reason", "Status", "Created", "Actions"]}>
            {data.map((a) => (
              <tr key={a.id} className="hover:bg-accent transition-colors duration-200">
                <td className="px-4 py-2 text-sm font-mono">{a.adjustmentNumber}</td>
                <td className="px-4 py-2 text-sm">{a.warehouse?.name ?? "—"}</td>
                <td className="px-4 py-2 text-sm">{a.reason}</td>
                <td className="px-4 py-2 text-sm">{a.status}</td>
                <td className="px-4 py-2 text-sm">{new Date(a.createdAt).toLocaleString()}</td>
                <td className="px-4 py-2">
                  {a.status === "DRAFT" && (
                    <button
                      type="button"
                      onClick={() => validateAdjustment.mutate(a.id)}
                      disabled={validateAdjustment.isPending}
                      className="text-sm text-green-600 hover:text-green-800 font-medium disabled:opacity-50"
                    >
                      Validate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Card>

      <Modal open={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create adjustment">
        <CreateAdjustmentForm
          warehouses={whRes ?? []}
          onSubmit={(body) => createAdjustment.mutate(body)}
          onCancel={() => setCreateModalOpen(false)}
          loading={createAdjustment.isPending}
          error={createAdjustment.error?.message}
        />
      </Modal>
    </div>
  );
}

function CreateAdjustmentForm({
  warehouses,
  onSubmit,
  onCancel,
  loading,
  error,
}: {
  warehouses: WarehouseWithLocations[];
  onSubmit: (body: {
    warehouseId: string;
    reason: string;
    notes?: string;
    items: Array<{ productId: string; locationId: string; quantityDelta: number; reason?: string }>;
  }) => void;
  onCancel: () => void;
  loading: boolean;
  error?: string;
}) {
  const [warehouseId, setWarehouseId] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<Array<{ productId: string; locationId: string; quantityDelta: number; reason?: string }>>([
    { productId: "", locationId: "", quantityDelta: 0 },
  ]);

  const { data: productsRes } = useQuery({
    queryKey: ["products", "all"],
    queryFn: async () => {
      const r = await productsApi.list({ take: 500 });
      if (!r.success) throw new Error(r.error);
      return r.data;
    },
  });
  const products = (productsRes?.items ?? []) as Array<{ id: string; sku: string; name: string }>;
  const locations = warehouses.find((w) => w.id === warehouseId)?.locations ?? [];

  const addRow = () => setItems((prev) => [...prev, { productId: "", locationId: "", quantityDelta: 0 }]);
  const removeRow = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: "productId" | "locationId" | "quantityDelta" | "reason", value: string | number) => {
    setItems((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouseId || !reason.trim()) return;
    const validItems = items.filter((row) => row.productId && row.locationId && row.quantityDelta !== 0);
    if (validItems.length === 0) return;
    onSubmit({
      warehouseId,
      reason: reason.trim(),
      notes: notes.trim() || undefined,
      items: validItems,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div>
        <label className="block text-sm font-bold text-dark uppercase mb-2">Warehouse *</label>
        <select
          value={warehouseId}
          onChange={(e) => setWarehouseId(e.target.value)}
          className="w-full px-3 py-2 border-[3px] border-dark rounded-[8px] bg-white text-dark font-bold placeholder-muted focus:outline-none focus:bg-[#fefce8] focus:-translate-y-[2px] focus:-translate-x-[2px] shadow-[2px_2px_0px_0px_var(--color-dark)] focus:shadow-[4px_4px_0px_0px_var(--color-dark)] transition-all duration-200"
          required
        >
          <option value="">Select warehouse</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-bold text-dark uppercase mb-2">Reason *</label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Physical count correction"
          className="w-full px-3 py-2 border-[3px] border-dark rounded-[8px] bg-white text-dark font-bold placeholder-muted focus:outline-none focus:bg-[#fefce8] focus:-translate-y-[2px] focus:-translate-x-[2px] shadow-[2px_2px_0px_0px_var(--color-dark)] focus:shadow-[4px_4px_0px_0px_var(--color-dark)] transition-all duration-200"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-bold text-dark uppercase mb-2">Notes</label>
        <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 border-[3px] border-dark rounded-[8px] bg-white text-dark font-bold placeholder-muted focus:outline-none focus:bg-[#fefce8] focus:-translate-y-[2px] focus:-translate-x-[2px] shadow-[2px_2px_0px_0px_var(--color-dark)] focus:shadow-[4px_4px_0px_0px_var(--color-dark)] transition-all duration-200" />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-slate-700">Items (use negative for decrease) *</label>
          <button type="button" onClick={addRow} className="text-sm text-slate-600 hover:text-slate-800 underline">+ Add row</button>
        </div>
        <div className="space-y-2 max-h-48 overflow-auto">
          {items.map((row, i) => (
            <div key={i} className="flex gap-2 items-end flex-wrap">
              <select
                value={row.productId}
                onChange={(e) => updateRow(i, "productId", e.target.value)}
                className="flex-1 min-w-[120px] px-2 py-1.5 border border-slate-300 rounded text-sm"
                required
              >
                <option value="">Product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.sku} – {p.name}</option>
                ))}
              </select>
              <select
                value={row.locationId}
                onChange={(e) => updateRow(i, "locationId", e.target.value)}
                className="flex-1 min-w-[100px] px-2 py-1.5 border border-slate-300 rounded text-sm"
                required
              >
                <option value="">Location</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.code}</option>
                ))}
              </select>
              <input
                type="number"
                value={row.quantityDelta}
                onChange={(e) => updateRow(i, "quantityDelta", parseInt(e.target.value, 10) || 0)}
                placeholder="+ or -"
                className="w-24 px-2 py-1.5 border border-slate-300 rounded text-sm"
              />
              <input
                type="text"
                value={row.reason ?? ""}
                onChange={(e) => updateRow(i, "reason", e.target.value)}
                placeholder="Item reason"
                className="flex-1 min-w-[80px] px-2 py-1.5 border border-slate-300 rounded text-sm"
              />
              <button type="button" onClick={() => removeRow(i)} className="text-red-600 hover:text-red-800 text-sm">Remove</button>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-3 py-2 bg-card text-dark font-bold uppercase border-[3px] border-dark rounded-[8px] hover:bg-accent hover:-translate-y-[2px] hover:-translate-x-[2px] shadow-[2px_2px_0px_0px_var(--color-dark)] hover:shadow-[4px_4px_0px_0px_var(--color-dark)] transition-all duration-200 rounded-md ">Cancel</button>
        <button type="submit" disabled={loading} className="px-3 py-2 bg-dark text-white font-bold uppercase border-[3px] border-dark rounded-[8px] hover:-translate-y-[2px] hover:-translate-x-[2px] shadow-[2px_2px_0px_0px_var(--color-dark)] hover:shadow-[4px_4px_0px_0px_var(--color-dark)] transition-all duration-200 rounded-md hover:bg-slate-700 disabled:opacity-50">
          {loading ? "Creating…" : "Create adjustment"}
        </button>
      </div>
    </form>
  );
}
