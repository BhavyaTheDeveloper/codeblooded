export interface DashboardKpis {
  totalProductsInStock: number;
  totalQuantityInStock: number;
  lowStockItemsCount: number;
  lowStockItems: Array<{
    productId: string;
    sku: string;
    name: string;
    minStock: number;
    currentStock: number;
  }>;
  pendingReceiptsCount: number;
  pendingDeliveriesCount: number;
  pendingTransfersCount: number;
}
