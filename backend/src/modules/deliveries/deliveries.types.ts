export interface DeliveryItemInput {
  productId: string;
  locationId: string;
  quantity: number;
  unit?: string;
}

export interface CreateDeliveryInput {
  customer?: string;
  warehouseId: string;
  notes?: string;
  items: DeliveryItemInput[];
}

export interface UpdateDeliveryInput {
  customer?: string;
  notes?: string;
  items?: DeliveryItemInput[];
}
