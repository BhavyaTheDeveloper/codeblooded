import { prisma } from "../../lib/prisma.js";
import type { LedgerEntryInput } from "./ledger.types.js";

export async function createLedgerEntries(entries: LedgerEntryInput[]): Promise<void> {
  if (entries.length === 0) return;

  const candidateIds = Array.from(
    new Set(entries.map((e) => e.createdById).filter((id): id is string => typeof id === "string" && id.length > 0))
  );

  const existingUserIds =
    candidateIds.length === 0
      ? new Set<string>()
      : new Set(
          (
            await prisma.user.findMany({
              where: { id: { in: candidateIds } },
              select: { id: true },
            })
          ).map((u) => u.id)
        );

  await prisma.stockLedgerEntry.createMany({
    data: entries.map((e) => ({
      documentType: e.documentType,
      documentId: e.documentId,
      productId: e.productId,
      warehouseId: e.warehouseId,
      locationId: e.locationId,
      quantityDelta: e.quantityDelta,
      quantityAfter: e.quantityAfter,
      ...(e.createdById && existingUserIds.has(e.createdById) && { createdById: e.createdById }),
    })),
  });
}
