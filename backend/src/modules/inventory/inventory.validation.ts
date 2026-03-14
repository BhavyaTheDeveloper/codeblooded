import { z } from "zod";

export const listInventoryQuerySchema = z.object({
  warehouseId: z.string().cuid().optional(),
  productId: z.string().cuid().optional(),
  locationId: z.string().cuid().optional(),
  skip: z.coerce.number().int().min(0).optional().default(0),
  take: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export const listLedgerQuerySchema = z.object({
  documentType: z.enum(["RECEIPT", "DELIVERY", "TRANSFER", "ADJUSTMENT"]).optional(),
  productId: z.string().cuid().optional(),
  warehouseId: z.string().cuid().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  skip: z.coerce.number().int().min(0).optional().default(0),
  take: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export type ListInventoryQuery = z.infer<typeof listInventoryQuerySchema>;
export type ListLedgerQuery = z.infer<typeof listLedgerQuerySchema>;
