export interface AdjustmentItemInput {
  productId: string;
  locationId: string;
  quantityDelta: number; // positive or negative
  reason?: string;
}

export interface CreateAdjustmentInput {
  warehouseId: string;
  reason: string;
  notes?: string;
  items: AdjustmentItemInput[];
}

export interface UpdateAdjustmentInput {
  reason?: string;
  notes?: string;
  items?: AdjustmentItemInput[];
}
