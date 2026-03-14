export interface WarehouseCreate {
  code: string;
  name: string;
  address?: string;
}

export interface WarehouseUpdate {
  code?: string;
  name?: string;
  address?: string;
}

export interface LocationCreate {
  code: string;
  name?: string;
}

export interface LocationUpdate {
  code?: string;
  name?: string;
}
