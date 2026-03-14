import { z } from "zod";

const receiptItemSchema = z.object({
  productId: z.string().cuid(),
  locationId: z.string().cuid(),
  quantity: z.number().int().positive(),
  unit: z.string().optional().default("UNIT"),
});

export const createReceiptSchema = z.object({
  supplier: z.string().optional(),
  warehouseId: z.string().cuid(),
  notes: z.string().optional(),
  items: z.array(receiptItemSchema).min(1, "At least one item required"),
});

export const updateReceiptSchema = z.object({
  supplier: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(receiptItemSchema).min(1).optional(),
});

export type CreateReceiptInput = z.infer<typeof createReceiptSchema>;
export type UpdateReceiptInput = z.infer<typeof updateReceiptSchema>;
