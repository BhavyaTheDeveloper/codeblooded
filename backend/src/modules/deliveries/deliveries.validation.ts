import { z } from "zod";

const deliveryItemSchema = z.object({
  productId: z.string().cuid(),
  locationId: z.string().cuid(),
  quantity: z.number().int().positive(),
  unit: z.string().optional().default("UNIT"),
});

export const createDeliverySchema = z.object({
  customer: z.string().optional(),
  warehouseId: z.string().cuid(),
  notes: z.string().optional(),
  items: z.array(deliveryItemSchema).min(1, "At least one item required"),
});

export const updateDeliverySchema = z.object({
  customer: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(deliveryItemSchema).min(1).optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(["DRAFT", "PICKED", "PACKED"]),
});

export type CreateDeliveryInput = z.infer<typeof createDeliverySchema>;
export type UpdateDeliveryInput = z.infer<typeof updateDeliverySchema>;
