import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import type { CreateProductInput, UpdateProductInput, ListProductsQuery } from "./products.validation.js";

export async function createProduct(data: CreateProductInput) {
  const existing = await prisma.product.findUnique({ where: { sku: data.sku } });
  if (existing) {
    throw Object.assign(new Error("Product with this SKU already exists"), { status: 400, code: "SKU_EXISTS" });
  }
  const product = await prisma.product.create({
    data: {
      sku: data.sku,
      name: data.name,
      description: data.description ?? null,
      unit: data.unit ?? "UNIT",
      minStock: data.minStock ?? 0,
      categoryId: data.categoryId ?? null,
    },
    include: { category: true },
  });
  if (data.initialStock) {
    await prisma.inventory.upsert({
      where: {
        productId_warehouseId_locationId: {
          productId: product.id,
          warehouseId: data.initialStock.warehouseId,
          locationId: data.initialStock.locationId,
        },
      },
      create: {
        productId: product.id,
        warehouseId: data.initialStock.warehouseId,
        locationId: data.initialStock.locationId,
        quantity: data.initialStock.quantity,
      },
      update: { quantity: { increment: data.initialStock.quantity } },
    });
  }
  return product;
}

export async function listProducts(query: ListProductsQuery) {
  const where: Prisma.ProductWhereInput = {};
  if (query.search?.trim()) {
    const term = query.search.trim();
    where.OR = [
      { sku: { contains: term, mode: "insensitive" } },
      { name: { contains: term, mode: "insensitive" } },
    ];
  }
  if (query.categoryId) {
    where.categoryId = query.categoryId;
  }

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where: Object.keys(where).length ? where : undefined,
      include: { category: true },
      orderBy: { sku: "asc" },
      skip: query.skip,
      take: query.take,
    }),
    prisma.product.count({ where: Object.keys(where).length ? where : undefined }),
  ]);

  // Compute current stock per product from Inventory and attach it to each product
  const productIds = items.map((p) => p.id);
  let stockByProduct = new Map<string, number>();
  if (productIds.length > 0) {
    const inventoryAgg = await prisma.inventory.groupBy({
      by: ["productId"],
      where: { productId: { in: productIds } },
      _sum: { quantity: true },
    });
    stockByProduct = new Map(inventoryAgg.map((row) => [row.productId, row._sum.quantity ?? 0]));
  }

  const itemsWithStock = items.map((p) => ({
    ...p,
    currentStock: stockByProduct.get(p.id) ?? 0,
  }));

  return { items: itemsWithStock, total };
}

export async function getProductById(id: string) {
  return prisma.product.findUniqueOrThrow({
    where: { id },
    include: { category: true },
  });
}

export async function getProductBySku(sku: string) {
  return prisma.product.findUniqueOrThrow({
    where: { sku },
    include: { category: true },
  });
}

export async function updateProduct(id: string, data: UpdateProductInput) {
  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.unit !== undefined && { unit: data.unit }),
      ...(data.minStock !== undefined && { minStock: data.minStock }),
      ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
    },
    include: { category: true },
  });
  if (data.setStock) {
    await prisma.inventory.upsert({
      where: {
        productId_warehouseId_locationId: {
          productId: id,
          warehouseId: data.setStock.warehouseId,
          locationId: data.setStock.locationId,
        },
      },
      create: {
        productId: id,
        warehouseId: data.setStock.warehouseId,
        locationId: data.setStock.locationId,
        quantity: data.setStock.quantity,
      },
      update: { quantity: data.setStock.quantity },
    });
  }
  return product;
}

export async function deleteProduct(id: string) {
  return prisma.product.delete({ where: { id } });
}
