import type { LedgerDocumentType } from "@prisma/client";

export type { LedgerDocumentType };

export interface LedgerEntryInput {
  documentType: LedgerDocumentType;
  documentId: string;
  productId: string;
  warehouseId: string;
  locationId: string;
  quantityDelta: number;
  quantityAfter: number;
  createdById: string;
}
