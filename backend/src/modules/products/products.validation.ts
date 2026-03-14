import { z } from "zod";

export const createProductSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  unit: z.string().default("UNIT"),
  minStock: z.number().int().min(0).optional().default(0),
  categoryId: z.string().cuid().optional().nullable(),
  initialStock: z.object({
    warehouseId: z.string().cuid(),
    locationId: z.string().cuid(),
    quantity: z.number().int().min(0),
  }),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  unit: z.string().optional(),
  minStock: z.number().int().min(0).optional(),
  categoryId: z.string().cuid().optional().nullable(),
  setStock: z
    .object({
      warehouseId: z.string().cuid(),
      locationId: z.string().cuid(),
      quantity: z.number().int().min(0),
    })
    .optional(),
});

export const listProductsQuerySchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().cuid().optional(),
  skip: z.coerce.number().int().min(0).optional().default(0),
  // Allow larger page sizes so forms that load all products (e.g. receipts/deliveries) can request up to 500.
  take: z.coerce.number().int().min(1).max(500).optional().default(50),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
