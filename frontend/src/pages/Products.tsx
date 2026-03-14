import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoriesApi, productsApi, warehousesApi } from "../api/endpoints";
import { Card } from "../components/Card";
import { DataTable } from "../components/DataTable";
import { Modal } from "../components/Modal";

type ProductRow = {
  id: string;
  sku: string;
  name: string;
  description?: string | null;
  category?: { id: string; name: string } | null;
  unit: string;
  minStock: number;
  currentStock?: number;
};

export function Products() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<ProductRow | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<ProductRow | null>(null);
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

  const { data: warehouses } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const r = await warehousesApi.list();
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
      minStock?: number;
      categoryId?: string | null;
      initialStock: { warehouseId: string; locationId: string; quantity: number };
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

  const updateProduct = useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: {
        name?: string;
        description?: string;
        unit?: string;
        minStock?: number;
        categoryId?: string | null;
        setStock?: { warehouseId: string; locationId: string; quantity: number };
      };
    }) => {
      const r = await productsApi.update(id, body);
      if (!r.success) throw new Error(r.error);
      return r.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setEditProduct(null);
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await productsApi.delete(id);
      if (!r.success) throw new Error(r.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setDeleteProduct(null);
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
          <DataTable columns={["SKU", "Name", "Category", "Unit", "Stock", "Min stock", "Actions"]}>
            {(data.items as ProductRow[]).map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-2 text-sm">{p.sku}</td>
                <td className="px-4 py-2 text-sm">{p.name}</td>
                <td className="px-4 py-2 text-sm">{p.category?.name ?? "—"}</td>
                <td className="px-4 py-2 text-sm">{p.unit}</td>
                <td className="px-4 py-2 text-sm font-mono">{p.currentStock ?? 0}</td>
                <td className="px-4 py-2 text-sm">{p.minStock}</td>
                <td className="px-4 py-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditProduct(p)}
                      className="px-2 py-1 text-xs border border-slate-300 rounded hover:bg-slate-100"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteProduct(p)}
                      className="px-2 py-1 text-xs border border-red-300 text-red-700 rounded hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </td>
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
          mode="create"
          categories={catRes ?? []}
          warehouses={warehouses ?? []}
          onSubmit={(body) => {
            if (body.sku && body.initialStock) {
              createProduct.mutate({
                sku: body.sku,
                name: body.name,
                description: body.description,
                unit: body.unit,
                minStock: body.minStock ?? 0,
                categoryId: body.categoryId ?? null,
                initialStock: body.initialStock,
              });
            }
          }}
          onCancel={() => setProductModalOpen(false)}
          loading={createProduct.isPending}
          error={createProduct.error?.message}
        />
      </Modal>

      <Modal open={!!editProduct} onClose={() => setEditProduct(null)} title="Edit product">
        {editProduct && (
          <ProductForm
            mode="edit"
            editProduct={editProduct}
            categories={catRes ?? []}
            warehouses={warehouses ?? []}
            onSubmit={(body) => updateProduct.mutate({ id: editProduct.id, body })}
            onCancel={() => setEditProduct(null)}
            loading={updateProduct.isPending}
            error={updateProduct.error?.message}
          />
        )}
      </Modal>

      <Modal open={!!deleteProduct} onClose={() => setDeleteProduct(null)} title="Delete product">
        {deleteProduct && (
          <div className="space-y-3">
            <p className="text-slate-700">
              Delete <strong>{deleteProduct.name}</strong> (SKU: {deleteProduct.sku})? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteProduct(null)}
                className="px-3 py-2 border border-slate-300 rounded-md hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteProductMutation.mutate(deleteProduct.id)}
                disabled={deleteProductMutation.isPending}
                className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {deleteProductMutation.isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        )}
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

type Warehouse = {
  id: string;
  code: string;
  name: string;
  locations: Array<{ id: string; code: string; name: string | null }>;
};

function ProductForm({
  mode,
  editProduct,
  categories,
  warehouses,
  onSubmit,
  onCancel,
  loading,
  error,
}: {
  mode: "create" | "edit";
  editProduct?: ProductRow | null;
  categories: Array<{ id: string; name: string }>;
  warehouses: Warehouse[];
  onSubmit: (body: {
    sku?: string;
    name: string;
    description?: string;
    unit: string;
    minStock?: number;
    categoryId?: string | null;
    initialStock?: { warehouseId: string; locationId: string; quantity: number };
    setStock?: { warehouseId: string; locationId: string; quantity: number };
  }) => void;
  onCancel: () => void;
  loading: boolean;
  error?: string;
}) {
  const [sku, setSku] = useState(editProduct?.sku ?? "");
  const [name, setName] = useState(editProduct?.name ?? "");
  const [description, setDescription] = useState(editProduct?.description ?? "");
  const [unit, setUnit] = useState(editProduct?.unit ?? "UNIT");
  const [minStock, setMinStock] = useState(editProduct?.minStock ?? 0);
  const [categoryId, setCategoryId] = useState<string>(editProduct?.category?.id ?? "");
  const [warehouseId, setWarehouseId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [initialQuantity, setInitialQuantity] = useState(0);

  const locations = warehouseId ? warehouses.find((w) => w.id === warehouseId)?.locations ?? [] : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "create") {
      if (!sku.trim() || !name.trim()) return;
      if (!warehouseId || !locationId) return; // quantity required (initial stock compulsory)
      const body = {
        sku: sku.trim(),
        name: name.trim(),
        description: description.trim() || undefined,
        unit,
        minStock: minStock ?? 0,
        categoryId: categoryId || null,
        initialStock: { warehouseId, locationId, quantity: Math.max(0, initialQuantity) } as {
          warehouseId: string;
          locationId: string;
          quantity: number;
        },
      };
      onSubmit(body);
      setSku("");
      setName("");
      setDescription("");
      setMinStock(0);
      setCategoryId("");
      setWarehouseId("");
      setLocationId("");
      setInitialQuantity(0);
    } else {
      if (!name.trim()) return;
      const body: {
        name: string;
        description?: string;
        unit: string;
        minStock?: number;
        categoryId?: string | null;
        setStock?: { warehouseId: string; locationId: string; quantity: number };
      } = {
        name: name.trim(),
        description: description.trim() || undefined,
        unit,
        minStock: minStock ?? 0,
        categoryId: categoryId || null,
      };
      if (warehouseId && locationId) {
        body.setStock = { warehouseId, locationId, quantity: Math.max(0, initialQuantity) };
      }
      onSubmit(body);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {mode === "create" && (
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
      )}
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
        <label className="block text-sm font-medium text-slate-700 mb-1">Min stock (optional, default 0)</label>
        <input
          type="number"
          min={0}
          value={minStock}
          onChange={(e) => setMinStock(parseInt(e.target.value, 10) || 0)}
          placeholder="0"
          className="w-full px-3 py-2 border border-slate-300 rounded-md"
        />
      </div>
      {mode === "create" && warehouses.length > 0 && (
        <>
          <hr className="border-slate-200" />
          <p className="text-sm font-medium text-slate-700">Initial quantity *</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-0.5">Warehouse *</label>
              <select
                value={warehouseId}
                onChange={(e) => {
                  setWarehouseId(e.target.value);
                  setLocationId("");
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                required
              >
                <option value="">Select…</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-0.5">Location *</label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                required
                disabled={!warehouseId}
              >
                <option value="">Select…</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.code}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-0.5">Quantity *</label>
              <input
                type="number"
                min={0}
                value={initialQuantity}
                onChange={(e) => setInitialQuantity(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                required
              />
            </div>
          </div>
        </>
      )}
      {mode === "edit" && warehouses.length > 0 && (
        <>
          <hr className="border-slate-200" />
          <p className="text-sm font-medium text-slate-700">Update quantity (optional)</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-0.5">Warehouse</label>
              <select
                value={warehouseId}
                onChange={(e) => {
                  setWarehouseId(e.target.value);
                  setLocationId("");
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              >
                <option value="">—</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-0.5">Location</label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                disabled={!warehouseId}
              >
                <option value="">—</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.code}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-0.5">Quantity</label>
              <input
                type="number"
                min={0}
                value={initialQuantity}
                onChange={(e) => setInitialQuantity(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              />
            </div>
          </div>
        </>
      )}
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
