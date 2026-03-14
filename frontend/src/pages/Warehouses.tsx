import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { warehousesApi } from "../api/endpoints";
import { Card } from "../components/Card";
import { DataTable } from "../components/DataTable";
import { Modal } from "../components/Modal";

type Warehouse = {
  id: string;
  code: string;
  name: string;
  address: string | null;
  locations: Array<{ id: string; code: string; name: string | null }>;
};

export function Warehouses() {
  const [warehouseModalOpen, setWarehouseModalOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const r = await warehousesApi.list();
      if (!r.success) throw new Error(r.error);
      return r.data as Warehouse[];
    },
  });

  const createWarehouse = useMutation({
    mutationFn: async (body: { code: string; name: string; address?: string }) => {
      const r = await warehousesApi.create(body);
      if (!r.success) throw new Error(r.error);
      return r.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      setWarehouseModalOpen(false);
    },
  });

  const createLocation = useMutation({
    mutationFn: async (body: { code: string; name?: string }) => {
      if (!selectedWarehouseId) throw new Error("Select a warehouse first");
      const r = await warehousesApi.createLocation(selectedWarehouseId, body);
      if (!r.success) throw new Error(r.error);
      return r.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      setLocationModalOpen(false);
      setSelectedWarehouseId("");
    },
  });

  const openLocationModal = (warehouseId: string) => {
    setSelectedWarehouseId(warehouseId);
    setLocationModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Warehouses</h1>
        <button
          type="button"
          onClick={() => setWarehouseModalOpen(true)}
          className="px-3 py-2 text-sm bg-slate-800 text-white rounded-md hover:bg-slate-700"
        >
          Add warehouse
        </button>
      </div>
      <Card title="Warehouses & locations">
        {isLoading && <p className="text-slate-500">Loading…</p>}
        {error && <p className="text-red-600">Failed to load</p>}
        {data && (
          <DataTable columns={["Code", "Name", "Address", "Locations", "Actions"]}>
            {data.map((w) => (
              <tr key={w.id}>
                <td className="px-4 py-2 text-sm font-mono">{w.code}</td>
                <td className="px-4 py-2 text-sm">{w.name}</td>
                <td className="px-4 py-2 text-sm text-slate-600">{w.address ?? "—"}</td>
                <td className="px-4 py-2 text-sm">{w.locations.map((l) => l.code).join(", ") || "—"}</td>
                <td className="px-4 py-2">
                  <button
                    type="button"
                    onClick={() => openLocationModal(w.id)}
                    className="text-sm text-slate-600 hover:text-slate-800 underline"
                  >
                    Add location
                  </button>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Card>

      <Modal open={warehouseModalOpen} onClose={() => setWarehouseModalOpen(false)} title="Add warehouse">
        <WarehouseForm
          onSubmit={(body) => createWarehouse.mutate(body)}
          onCancel={() => setWarehouseModalOpen(false)}
          loading={createWarehouse.isPending}
          error={createWarehouse.error?.message}
        />
      </Modal>

      <Modal open={locationModalOpen} onClose={() => { setLocationModalOpen(false); setSelectedWarehouseId(""); }} title="Add location">
        <LocationForm
          warehouse={data?.find((w) => w.id === selectedWarehouseId)}
          onSubmit={(body) => createLocation.mutate(body)}
          onCancel={() => { setLocationModalOpen(false); setSelectedWarehouseId(""); }}
          loading={createLocation.isPending}
          error={createLocation.error?.message}
        />
      </Modal>
    </div>
  );
}

function WarehouseForm({
  onSubmit,
  onCancel,
  loading,
  error,
}: {
  onSubmit: (body: { code: string; name: string; address?: string }) => void;
  onCancel: () => void;
  loading: boolean;
  error?: string;
}) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;
    onSubmit({ code: code.trim(), name: name.trim(), address: address.trim() || undefined });
    setCode("");
    setName("");
    setAddress("");
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Code *</label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md"
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-3 py-2 border border-slate-300 rounded-md hover:bg-slate-50">
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-3 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700 disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}

function LocationForm({
  warehouse,
  onSubmit,
  onCancel,
  loading,
  error,
}: {
  warehouse?: Warehouse;
  onSubmit: (body: { code: string; name?: string }) => void;
  onCancel: () => void;
  loading: boolean;
  error?: string;
}) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    onSubmit({ code: code.trim(), name: name.trim() || undefined });
    setCode("");
    setName("");
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {warehouse && <p className="text-sm text-slate-600">Adding to warehouse: <strong>{warehouse.name}</strong></p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Location code *</label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g. A-01"
          className="w-full px-3 py-2 border border-slate-300 rounded-md"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Aisle A, Shelf 1"
          className="w-full px-3 py-2 border border-slate-300 rounded-md"
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-3 py-2 border border-slate-300 rounded-md hover:bg-slate-50">
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-3 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700 disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
