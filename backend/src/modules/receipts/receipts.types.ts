export interface ReceiptItemInput {
  productId: string;
  locationId: string;
  quantity: number;
  unit?: string;
}

export interface CreateReceiptInput {
  supplier?: string;
  warehouseId: string;
  notes?: string;
  items: ReceiptItemInput[];
}

export interface UpdateReceiptInput {
  supplier?: string;
  notes?: string;
  items?: ReceiptItemInput[];
}
