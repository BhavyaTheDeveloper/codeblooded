import { z } from "zod";

export const createWarehouseSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  address: z.string().optional(),
});

export const updateWarehouseSchema = z.object({
  code: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  address: z.string().optional(),
});

export const createLocationSchema = z.object({
  code: z.string().min(1),
  name: z.string().optional(),
});

export const updateLocationSchema = z.object({
  code: z.string().min(1).optional(),
  name: z.string().optional(),
});

export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>;
export type UpdateWarehouseInput = z.infer<typeof updateWarehouseSchema>;
export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
