import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import type { ListInventoryQuery, ListLedgerQuery } from "./inventory.validation.js";

export async function listInventory(query: ListInventoryQuery) {
  const where: Prisma.InventoryWhereInput = {};
  if (query.warehouseId) where.warehouseId = query.warehouseId;
  if (query.productId) where.productId = query.productId;
  if (query.locationId) where.locationId = query.locationId;

  const [items, total] = await Promise.all([
    prisma.inventory.findMany({
      where,
      include: {
        product: { include: { category: true } },
        warehouse: true,
        location: true,
      },
      orderBy: [{ warehouseId: "asc" }, { productId: "asc" }, { locationId: "asc" }],
      skip: query.skip,
      take: query.take,
    }),
    prisma.inventory.count({ where }),
  ]);
  return { items, total };
}

export async function listLedger(query: ListLedgerQuery) {
  const where: Prisma.StockLedgerEntryWhereInput = {};
  if (query.documentType) where.documentType = query.documentType;
  if (query.productId) where.productId = query.productId;
  if (query.warehouseId) where.warehouseId = query.warehouseId;
  if (query.fromDate || query.toDate) {
    where.createdAt = {};
    if (query.fromDate) (where.createdAt as { gte?: Date }).gte = new Date(query.fromDate);
    if (query.toDate) (where.createdAt as { lte?: Date }).lte = new Date(query.toDate);
  }

  const [items, total] = await Promise.all([
    prisma.stockLedgerEntry.findMany({
      where,
      include: {
        product: true,
        warehouse: true,
        location: true,
        createdBy: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: query.skip,
      take: query.take,
    }),
    prisma.stockLedgerEntry.count({ where }),
  ]);
  return { items, total };
}
