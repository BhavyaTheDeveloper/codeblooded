import { get, post, patch, del } from "./client";

export const authApi = {
  signup: (body: { email: string; password: string; name?: string }) =>
    post<{ user: { id: string; email: string; name: string | null; role: string }; token: string; expiresIn: string }>(
      "/auth/signup",
      body
    ),
  login: (body: { email: string; password: string }) =>
    post<{ user: { id: string; email: string; name: string | null; role: string }; token: string; expiresIn: string }>(
      "/auth/login",
      body
    ),
  forgotPassword: (body: { email: string }) => post<{ message: string }>("/auth/forgot-password", body),
  resetPassword: (body: { email: string; otpCode: string; newPassword: string }) =>
    post<{ message: string }>("/auth/reset-password", body),
};

export const categoriesApi = {
  list: () => get<Array<{ id: string; name: string; description: string | null }>>("/categories"),
  create: (body: { name: string; description?: string }) => post("/categories", body),
  get: (id: string) => get(`/categories/${id}`),
  update: (id: string, body: { name?: string; description?: string }) => patch(`/categories/${id}`, body),
  delete: (id: string) => del(`/categories/${id}`),
};

export const productsApi = {
  list: (params?: { search?: string; categoryId?: string; skip?: number; take?: number }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set("search", params.search);
    if (params?.categoryId) q.set("categoryId", params.categoryId);
    if (params?.skip != null) q.set("skip", String(params.skip));
    if (params?.take != null) q.set("take", String(params.take));
    return get<{ items: unknown[]; total: number }>(`/products?${q}`);
  },
  create: (body: {
    sku: string;
    name: string;
    description?: string;
    unit?: string;
    minStock?: number;
    categoryId?: string | null;
    initialStock: { warehouseId: string; locationId: string; quantity: number };
  }) => post("/products", body),
  get: (id: string) => get(`/products/${id}`),
  update: (
    id: string,
    body: {
      name?: string;
      description?: string;
      unit?: string;
      minStock?: number;
      categoryId?: string | null;
      setStock?: { warehouseId: string; locationId: string; quantity: number };
    }
  ) => patch(`/products/${id}`, body),
  delete: (id: string) => del(`/products/${id}`),
};

export const warehousesApi = {
  list: () =>
    get<
      Array<{
        id: string;
        code: string;
        name: string;
        address: string | null;
        locations: Array<{ id: string; code: string; name: string | null }>;
      }>
    >("/warehouses"),
  create: (body: { code: string; name: string; address?: string }) => post("/warehouses", body),
  get: (id: string) => get(`/warehouses/${id}`),
  update: (id: string, body: { code?: string; name?: string; address?: string }) => patch(`/warehouses/${id}`, body),
  delete: (id: string) => del(`/warehouses/${id}`),
  listLocations: (warehouseId: string) => get<Array<{ id: string; code: string; name: string | null }>>(`/warehouses/${warehouseId}/locations`),
  createLocation: (warehouseId: string, body: { code: string; name?: string }) =>
    post(`/warehouses/${warehouseId}/locations`, body),
};

export const receiptsApi = {
  list: (params?: { warehouseId?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.warehouseId) q.set("warehouseId", params.warehouseId);
    if (params?.status) q.set("status", params.status);
    return get<unknown[]>(`/receipts?${q}`);
  },
  create: (body: { warehouseId: string; supplier?: string; notes?: string; items: Array<{ productId: string; locationId: string; quantity: number; unit?: string }> }) =>
    post("/receipts", body),
  get: (id: string) => get(`/receipts/${id}`),
  update: (id: string, body: { supplier?: string; notes?: string; items?: Array<{ productId: string; locationId: string; quantity: number; unit?: string }> }) =>
    patch(`/receipts/${id}`, body),
  validate: (id: string) => post(`/receipts/${id}/validate`, {}),
};

export const deliveriesApi = {
  list: (params?: { warehouseId?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.warehouseId) q.set("warehouseId", params.warehouseId);
    if (params?.status) q.set("status", params.status);
    return get<unknown[]>(`/deliveries?${q}`);
  },
  create: (body: { warehouseId: string; customer?: string; notes?: string; items: Array<{ productId: string; locationId: string; quantity: number; unit?: string }> }) =>
    post("/deliveries", body),
  get: (id: string) => get(`/deliveries/${id}`),
  update: (id: string, body: { customer?: string; notes?: string; items?: Array<{ productId: string; locationId: string; quantity: number; unit?: string }> }) =>
    patch(`/deliveries/${id}`, body),
  updateStatus: (id: string, status: string) => patch(`/deliveries/${id}/status`, { status }),
  validate: (id: string) => post(`/deliveries/${id}/validate`, {}),
};

export const transfersApi = {
  list: (params?: { fromWarehouseId?: string; toWarehouseId?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.fromWarehouseId) q.set("fromWarehouseId", params.fromWarehouseId);
    if (params?.toWarehouseId) q.set("toWarehouseId", params.toWarehouseId);
    if (params?.status) q.set("status", params.status);
    return get<unknown[]>(`/transfers?${q}`);
  },
  create: (body: {
    fromWarehouseId: string;
    toWarehouseId: string;
    notes?: string;
    items: Array<{ productId: string; fromLocationId: string; toLocationId: string; quantity: number; unit?: string }>;
  }) => post("/transfers", body),
  get: (id: string) => get(`/transfers/${id}`),
  update: (id: string, body: { notes?: string; items?: Array<{ productId: string; fromLocationId: string; toLocationId: string; quantity: number; unit?: string }> }) =>
    patch(`/transfers/${id}`, body),
  validate: (id: string) => post(`/transfers/${id}/validate`, {}),
};

export const adjustmentsApi = {
  list: (params?: { warehouseId?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.warehouseId) q.set("warehouseId", params.warehouseId);
    if (params?.status) q.set("status", params.status);
    return get<unknown[]>(`/adjustments?${q}`);
  },
  create: (body: {
    warehouseId: string;
    reason: string;
    notes?: string;
    items: Array<{ productId: string; locationId: string; quantityDelta: number; reason?: string }>;
  }) => post("/adjustments", body),
  get: (id: string) => get(`/adjustments/${id}`),
  update: (id: string, body: { reason?: string; notes?: string; items?: Array<{ productId: string; locationId: string; quantityDelta: number; reason?: string }> }) =>
    patch(`/adjustments/${id}`, body),
  validate: (id: string) => post(`/adjustments/${id}/validate`, {}),
};

export const inventoryApi = {
  list: (params?: { warehouseId?: string; productId?: string; locationId?: string; skip?: number; take?: number }) => {
    const q = new URLSearchParams();
    if (params?.warehouseId) q.set("warehouseId", params.warehouseId);
    if (params?.productId) q.set("productId", params.productId);
    if (params?.locationId) q.set("locationId", params.locationId);
    if (params?.skip != null) q.set("skip", String(params.skip));
    if (params?.take != null) q.set("take", String(params.take));
    return get<{ items: unknown[]; total: number }>(`/inventory?${q}`);
  },
  ledger: (params?: { documentType?: string; productId?: string; warehouseId?: string; fromDate?: string; toDate?: string; skip?: number; take?: number }) => {
    const q = new URLSearchParams();
    if (params?.documentType) q.set("documentType", params.documentType);
    if (params?.productId) q.set("productId", params.productId);
    if (params?.warehouseId) q.set("warehouseId", params.warehouseId);
    if (params?.fromDate) q.set("fromDate", params.fromDate);
    if (params?.toDate) q.set("toDate", params.toDate);
    if (params?.skip != null) q.set("skip", String(params.skip));
    if (params?.take != null) q.set("take", String(params.take));
    return get<{ items: unknown[]; total: number }>(`/inventory/ledger?${q}`);
  },
};

export const dashboardApi = {
  kpis: () =>
    get<{
      totalProductsInStock: number;
      totalQuantityInStock: number;
      lowStockItemsCount: number;
      lowStockItems: Array<{ productId: string; sku: string; name: string; minStock: number; currentStock: number }>;
      pendingReceiptsCount: number;
      pendingDeliveriesCount: number;
      pendingTransfersCount: number;
    }>("/dashboard/kpis"),
  activities: (params?: { documentType?: string; warehouseId?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.documentType) q.set("documentType", params.documentType);
    if (params?.warehouseId) q.set("warehouseId", params.warehouseId);
    if (params?.limit != null) q.set("limit", String(params.limit));
    return get<unknown[]>(`/dashboard/activities?${q}`);
  },
};
