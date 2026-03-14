import { prisma } from "../../lib/prisma.js";
import type { LedgerEntryInput } from "./ledger.types.js";

export async function createLedgerEntries(entries: LedgerEntryInput[]): Promise<void> {
  if (entries.length === 0) return;
  await prisma.stockLedgerEntry.createMany({
    data: entries.map((e) => ({
      documentType: e.documentType,
      documentId: e.documentId,
      productId: e.productId,
      warehouseId: e.warehouseId,
      locationId: e.locationId,
      quantityDelta: e.quantityDelta,
      quantityAfter: e.quantityAfter,
      createdById: e.createdById,
    })),
  });
}
