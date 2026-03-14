import { prisma } from "../../lib/prisma.js";
import type { CreateCategoryInput, UpdateCategoryInput } from "./categories.validation.js";

export async function createCategory(data: CreateCategoryInput) {
  return prisma.category.create({ data });
}

export async function getCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}

export async function getCategoryById(id: string) {
  return prisma.category.findUniqueOrThrow({ where: { id } });
}

export async function updateCategory(id: string, data: UpdateCategoryInput) {
  return prisma.category.update({ where: { id }, data });
}

export async function deleteCategory(id: string) {
  return prisma.category.delete({ where: { id } });
}
