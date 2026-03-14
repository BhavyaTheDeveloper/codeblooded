import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoriesApi, productsApi } from "../api/endpoints";
import { Card } from "../components/Card";
import { DataTable } from "../components/DataTable";
import { Modal } from "../components/Modal";

export function Products() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: catRes } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const r = await categoriesApi.list();
      if (!r.success) throw new Error(r.error);
      return r.data;
    },
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["products", search, categoryId],
    queryFn: async () => {
      const r = await productsApi.list({
        search: search || undefined,
        categoryId: categoryId || undefined,
        take: 50,
      });
      if (!r.success) throw new Error(r.error);
      return r.data;
    },
  });

  const createProduct = useMutation({
    mutationFn: async (body: {
      sku: string;
      name: string;
      description?: string;
      unit: string;
      minStock: number;
      categoryId?: string | null;
    }) => {
      const r = await productsApi.create(body);
      if (!r.success) throw new Error(r.error);
      return r.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setProductModalOpen(false);
    },
  });

  const createCategory = useMutation({
    mutationFn: async (body: { name: string; description?: string }) => {
      const r = await categoriesApi.create(body);
      if (!r.success) throw new Error(r.error);
      return r.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setCategoryModalOpen(false);
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Products</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setCategoryModalOpen(true)}
            className="px-3 py-2 text-sm border border-slate-300 rounded-md hover:bg-slate-50"
          >
            Add category
          </button>
          <button
            type="button"
            onClick={() => setProductModalOpen(true)}
            className="px-3 py-2 text-sm bg-slate-800 text-white rounded-md hover:bg-slate-700"
          >
            Add product
          </button>
        </div>
      </div>

      <Card>
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="Search by SKU or name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md w-64"
          />
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md"
          >
            <option value="">All categories</option>
            {catRes?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      <Card title="Products">
        {isLoading && <p className="text-slate-500">Loading…</p>}
        {error && <p className="text-red-600">Failed to load</p>}
        {data && (
          <DataTable columns={["SKU", "Name", "Category", "Unit", "Min stock"]}>
            {(
              data.items as Array<{
                id: string;
                sku: string;
                name: string;
                category?: { name: string } | null;
                unit: string;
                minStock: number;
              }>
            ).map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-2 text-sm">{p.sku}</td>
                <td className="px-4 py-2 text-sm">{p.name}</td>
                <td className="px-4 py-2 text-sm">{p.category?.name ?? "—"}</td>
                <td className="px-4 py-2 text-sm">{p.unit}</td>
                <td className="px-4 py-2 text-sm">{p.minStock}</td>
              </tr>
            ))}
          </DataTable>
        )}
        {data && <p className="mt-2 text-sm text-slate-500">Total: {data.total}</p>}
      </Card>

      <Modal open={categoryModalOpen} onClose={() => setCategoryModalOpen(false)} title="Add category">
        <CategoryForm
          onSubmit={(name, description) => createCategory.mutate({ name, description: description || undefined })}
          onCancel={() => setCategoryModalOpen(false)}
          loading={createCategory.isPending}
          error={createCategory.error?.message}
        />
      </Modal>

      <Modal open={productModalOpen} onClose={() => setProductModalOpen(false)} title="Add product">
        <ProductForm
          categories={catRes ?? []}
          onSubmit={(body) => createProduct.mutate(body)}
          onCancel={() => setProductModalOpen(false)}
          loading={createProduct.isPending}
          error={createProduct.error?.message}
        />
      </Modal>
    </div>
  );
}

function CategoryForm({
  onSubmit,
  onCancel,
  loading,
  error,
}: {
  onSubmit: (name: string, description?: string) => void;
  onCancel: () => void;
  loading: boolean;
  error?: string;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim(), description.trim() || undefined);
    setName("");
    setDescription("");
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
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
        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md"
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-2 border border-slate-300 rounded-md hover:bg-slate-50"
        >
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

function ProductForm({
  categories,
  onSubmit,
  onCancel,
  loading,
  error,
}: {
  categories: Array<{ id: string; name: string }>;
  onSubmit: (body: {
    sku: string;
    name: string;
    description?: string;
    unit: string;
    minStock: number;
    categoryId?: string | null;
  }) => void;
  onCancel: () => void;
  loading: boolean;
  error?: string;
}) {
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("UNIT");
  const [minStock, setMinStock] = useState(0);
  const [categoryId, setCategoryId] = useState<string>("");
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || !name.trim()) return;
    onSubmit({
      sku: sku.trim(),
      name: name.trim(),
      description: description.trim() || undefined,
      unit,
      minStock: Math.max(0, minStock),
      categoryId: categoryId || null,
    });
    setSku("");
    setName("");
    setDescription("");
    setMinStock(0);
    setCategoryId("");
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">SKU *</label>
        <input
          type="text"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
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
        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md"
        >
          <option value="">None</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
        <input
          type="text"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Min stock</label>
        <input
          type="number"
          min={0}
          value={minStock}
          onChange={(e) => setMinStock(parseInt(e.target.value, 10) || 0)}
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
