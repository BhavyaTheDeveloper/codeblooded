export interface ProductCreate {
  sku: string;
  name: string;
  description?: string;
  unit?: string;
  minStock?: number;
  categoryId?: string;
}

export interface ProductUpdate {
  name?: string;
  description?: string;
  unit?: string;
  minStock?: number;
  categoryId?: string | null;
}

export interface ProductListQuery {
  search?: string;
  categoryId?: string;
  skip?: number;
  take?: number;
}
