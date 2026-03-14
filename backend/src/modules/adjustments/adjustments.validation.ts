import { z } from "zod";

const adjustmentItemSchema = z.object({
  productId: z.string().cuid(),
  locationId: z.string().cuid(),
  quantityDelta: z.number().int(), // can be negative
  reason: z.string().optional(),
});

export const createAdjustmentSchema = z.object({
  warehouseId: z.string().cuid(),
  reason: z.string().min(1),
  notes: z.string().optional(),
  items: z.array(adjustmentItemSchema).min(1, "At least one item required"),
});

export const updateAdjustmentSchema = z.object({
  reason: z.string().min(1).optional(),
  notes: z.string().optional(),
  items: z.array(adjustmentItemSchema).min(1).optional(),
});

export type CreateAdjustmentInput = z.infer<typeof createAdjustmentSchema>;
export type UpdateAdjustmentInput = z.infer<typeof updateAdjustmentSchema>;
