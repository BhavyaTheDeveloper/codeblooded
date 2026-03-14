import { z } from "zod";

const transferItemSchema = z.object({
  productId: z.string().cuid(),
  fromLocationId: z.string().cuid(),
  toLocationId: z.string().cuid(),
  quantity: z.number().int().positive(),
  unit: z.string().optional().default("UNIT"),
});

export const createTransferSchema = z.object({
  fromWarehouseId: z.string().cuid(),
  toWarehouseId: z.string().cuid(),
  notes: z.string().optional(),
  items: z.array(transferItemSchema).min(1, "At least one item required"),
});

export const updateTransferSchema = z.object({
  notes: z.string().optional(),
  items: z.array(transferItemSchema).min(1).optional(),
});

export type CreateTransferInput = z.infer<typeof createTransferSchema>;
export type UpdateTransferInput = z.infer<typeof updateTransferSchema>;
