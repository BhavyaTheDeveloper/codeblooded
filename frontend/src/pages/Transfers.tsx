import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { transfersApi, warehousesApi, productsApi } from "../api/endpoints";
import { Card } from "../components/Card";
import { DataTable } from "../components/DataTable";
import { Modal } from "../components/Modal";

type TransferRow = {
  id: string;
  transferNumber: string;
  fromWarehouse?: { name: string };
  toWarehouse?: { name: string };
  status: string;
  createdAt: string;
};

type WarehouseWithLocations = {
  id: string;
  name: string;
  locations: Array<{ id: string; code: string }>;
};

export function Transfers() {
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
    queryKey: ["transfers", status],
    queryFn: async () => {
      const r = await transfersApi.list({ status: status || undefined });
      if (!r.success) throw new Error(r.error);
      return r.data as TransferRow[];
    },
  });

  const createTransfer = useMutation({
    mutationFn: async (body: {
      fromWarehouseId: string;
      toWarehouseId: string;
      notes?: string;
      items: Array<{ productId: string; fromLocationId: string; toLocationId: string; quantity: number }>;
    }) => {
      const r = await transfersApi.create(body);
      if (!r.success) throw new Error(r.error);
      return r.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      setCreateModalOpen(false);
    },
  });

  const validateTransfer = useMutation({
    mutationFn: async (id: string) => {
      const r = await transfersApi.validate(id);
      if (!r.success) throw new Error(r.error);
      return r.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Internal transfers</h1>
        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="px-3 py-2 text-sm bg-slate-800 text-white rounded-md hover:bg-slate-700"
        >
          Create transfer
        </button>
      </div>
      <Card>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-md"
        >
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="VALIDATED">Validated</option>
        </select>
      </Card>
      <Card title="Transfers">
        {isLoading && <p className="text-slate-500">Loading…</p>}
        {error && <p className="text-red-600">Failed to load</p>}
        {data && (
          <DataTable columns={["Number", "From", "To", "Status", "Created", "Actions"]}>
            {data.map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-2 text-sm font-mono">{t.transferNumber}</td>
                <td className="px-4 py-2 text-sm">{t.fromWarehouse?.name ?? "—"}</td>
                <td className="px-4 py-2 text-sm">{t.toWarehouse?.name ?? "—"}</td>
                <td className="px-4 py-2 text-sm">{t.status}</td>
                <td className="px-4 py-2 text-sm">{new Date(t.createdAt).toLocaleString()}</td>
                <td className="px-4 py-2">
                  {t.status === "DRAFT" && (
                    <button
                      type="button"
                      onClick={() => validateTransfer.mutate(t.id)}
                      disabled={validateTransfer.isPending}
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

      <Modal open={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create transfer">
        <CreateTransferForm
          warehouses={whRes ?? []}
          onSubmit={(body) => createTransfer.mutate(body)}
          onCancel={() => setCreateModalOpen(false)}
          loading={createTransfer.isPending}
          error={createTransfer.error?.message}
        />
      </Modal>
    </div>
  );
}

function CreateTransferForm({
  warehouses,
  onSubmit,
  onCancel,
  loading,
  error,
}: {
  warehouses: WarehouseWithLocations[];
  onSubmit: (body: {
    fromWarehouseId: string;
    toWarehouseId: string;
    notes?: string;
    items: Array<{ productId: string; fromLocationId: string; toLocationId: string; quantity: number }>;
  }) => void;
  onCancel: () => void;
  loading: boolean;
  error?: string;
}) {
  const [fromWarehouseId, setFromWarehouseId] = useState("");
  const [toWarehouseId, setToWarehouseId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<Array<{ productId: string; fromLocationId: string; toLocationId: string; quantity: number }>>([
    { productId: "", fromLocationId: "", toLocationId: "", quantity: 1 },
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
  const fromLocations = warehouses.find((w) => w.id === fromWarehouseId)?.locations ?? [];
  const toLocations = warehouses.find((w) => w.id === toWarehouseId)?.locations ?? [];

  const addRow = () => setItems((prev) => [...prev, { productId: "", fromLocationId: "", toLocationId: "", quantity: 1 }]);
  const removeRow = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: "productId" | "fromLocationId" | "toLocationId" | "quantity", value: string | number) => {
    setItems((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromWarehouseId || !toWarehouseId) return;
    if (fromWarehouseId === toWarehouseId) return;
    const validItems = items.filter((row) => row.productId && row.fromLocationId && row.toLocationId && row.quantity > 0);
    if (validItems.length === 0) return;
    onSubmit({ fromWarehouseId, toWarehouseId, notes: notes.trim() || undefined, items: validItems });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">From warehouse *</label>
        <select
          value={fromWarehouseId}
          onChange={(e) => setFromWarehouseId(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md"
          required
        >
          <option value="">Select</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">To warehouse *</label>
        <select
          value={toWarehouseId}
          onChange={(e) => setToWarehouseId(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md"
          required
        >
          <option value="">Select</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
        <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md" />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-slate-700">Items *</label>
          <button type="button" onClick={addRow} className="text-sm text-slate-600 hover:text-slate-800 underline">+ Add row</button>
        </div>
        <div className="space-y-2 max-h-48 overflow-auto">
          {items.map((row, i) => (
            <div key={i} className="flex gap-2 items-end flex-wrap">
              <select
                value={row.productId}
                onChange={(e) => updateRow(i, "productId", e.target.value)}
                className="flex-1 min-w-[100px] px-2 py-1.5 border border-slate-300 rounded text-sm"
                required
              >
                <option value="">Product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.sku}</option>
                ))}
              </select>
              <select
                value={row.fromLocationId}
                onChange={(e) => updateRow(i, "fromLocationId", e.target.value)}
                className="w-24 px-2 py-1.5 border border-slate-300 rounded text-sm"
                required
              >
                <option value="">From</option>
                {fromLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.code}</option>
                ))}
              </select>
              <span className="text-slate-400">→</span>
              <select
                value={row.toLocationId}
                onChange={(e) => updateRow(i, "toLocationId", e.target.value)}
                className="w-24 px-2 py-1.5 border border-slate-300 rounded text-sm"
                required
              >
                <option value="">To</option>
                {toLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.code}</option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={row.quantity}
                onChange={(e) => updateRow(i, "quantity", parseInt(e.target.value, 10) || 0)}
                className="w-16 px-2 py-1.5 border border-slate-300 rounded text-sm"
              />
              <button type="button" onClick={() => removeRow(i)} className="text-red-600 hover:text-red-800 text-sm">Remove</button>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-3 py-2 border border-slate-300 rounded-md hover:bg-slate-50">Cancel</button>
        <button type="submit" disabled={loading} className="px-3 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700 disabled:opacity-50">
          {loading ? "Creating…" : "Create transfer"}
        </button>
      </div>
    </form>
  );
}
