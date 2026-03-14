import { ReceiptStatus, DeliveryStatus, TransferStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";

export async function getKpis() {
  const [
    inventoryAgg,
    productsWithMinStock,
    pendingReceiptsCount,
    pendingDeliveriesCount,
    pendingTransfersCount,
  ] = await Promise.all([
    prisma.inventory.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
    }),
    prisma.product.findMany({
      select: { id: true, sku: true, name: true, minStock: true },
    }),
    prisma.receipt.count({ where: { status: ReceiptStatus.DRAFT } }),
    prisma.delivery.count({ where: { status: { not: DeliveryStatus.VALIDATED } } }),
    prisma.transfer.count({ where: { status: TransferStatus.DRAFT } }),
  ]);

  const stockByProduct = new Map(inventoryAgg.map((a) => [a.productId, a._sum.quantity ?? 0]));
  let totalQuantityInStock = 0;
  const lowStockItems: Array<{ productId: string; sku: string; name: string; minStock: number; currentStock: number }> = [];

  for (const p of productsWithMinStock) {
    const current = stockByProduct.get(p.id) ?? 0;
    totalQuantityInStock += current;
    if (p.minStock > 0 && current < p.minStock) {
      lowStockItems.push({
        productId: p.id,
        sku: p.sku,
        name: p.name,
        minStock: p.minStock,
        currentStock: current,
      });
    }
  }

  return {
    totalProductsInStock: inventoryAgg.length,
    totalQuantityInStock,
    lowStockItemsCount: lowStockItems.length,
    lowStockItems,
    pendingReceiptsCount,
    pendingDeliveriesCount,
    pendingTransfersCount,
  };
}

export async function getRecentActivities(filters?: {
  documentType?: "RECEIPT" | "DELIVERY" | "TRANSFER" | "ADJUSTMENT";
  warehouseId?: string;
  limit?: number;
}) {
  const limit = filters?.limit ?? 20;
  const ledger = await prisma.stockLedgerEntry.findMany({
    where: {
      ...(filters?.documentType && { documentType: filters.documentType }),
      ...(filters?.warehouseId && { warehouseId: filters.warehouseId }),
    },
    include: {
      product: { select: { id: true, sku: true, name: true } },
      warehouse: { select: { id: true, code: true, name: true } },
      createdBy: { select: { id: true, email: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return ledger;
}
