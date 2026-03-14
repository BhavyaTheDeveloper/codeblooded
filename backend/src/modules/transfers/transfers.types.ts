export interface TransferItemInput {
  productId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
  unit?: string;
}

export interface CreateTransferInput {
  fromWarehouseId: string;
  toWarehouseId: string;
  notes?: string;
  items: TransferItemInput[];
}

export interface UpdateTransferInput {
  notes?: string;
  items?: TransferItemInput[];
}
