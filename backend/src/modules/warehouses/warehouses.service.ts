import { prisma } from "../../lib/prisma.js";
import type {
  CreateWarehouseInput,
  UpdateWarehouseInput,
  CreateLocationInput,
  UpdateLocationInput,
} from "./warehouses.validation.js";

export async function createWarehouse(data: CreateWarehouseInput) {
  const existing = await prisma.warehouse.findUnique({ where: { code: data.code } });
  if (existing) {
    throw Object.assign(new Error("Warehouse with this code already exists"), { status: 400, code: "CODE_EXISTS" });
  }
  return prisma.warehouse.create({
    data: { code: data.code, name: data.name, address: data.address ?? null },
  });
}

export async function listWarehouses() {
  return prisma.warehouse.findMany({
    orderBy: { code: "asc" },
    include: { locations: true },
  });
}

export async function getWarehouseById(id: string) {
  return prisma.warehouse.findUniqueOrThrow({
    where: { id },
    include: { locations: true },
  });
}

export async function updateWarehouse(id: string, data: UpdateWarehouseInput) {
  return prisma.warehouse.update({ where: { id }, data });
}

export async function deleteWarehouse(id: string) {
  return prisma.warehouse.delete({ where: { id } });
}

export async function createLocation(warehouseId: string, data: CreateLocationInput) {
  const warehouse = await prisma.warehouse.findUniqueOrThrow({ where: { id: warehouseId } });
  const existing = await prisma.location.findUnique({
    where: { warehouseId_code: { warehouseId, code: data.code } },
  });
  if (existing) {
    throw Object.assign(new Error("Location with this code already exists in this warehouse"), {
      status: 400,
      code: "CODE_EXISTS",
    });
  }
  return prisma.location.create({
    data: { warehouseId, code: data.code, name: data.name ?? null },
  });
}

export async function listLocations(warehouseId: string) {
  return prisma.location.findMany({
    where: { warehouseId },
    orderBy: { code: "asc" },
  });
}

export async function updateLocation(warehouseId: string, locationId: string, data: UpdateLocationInput) {
  await prisma.location.findFirstOrThrow({ where: { id: locationId, warehouseId } });
  return prisma.location.update({ where: { id: locationId }, data });
}

export async function deleteLocation(warehouseId: string, locationId: string) {
  await prisma.location.findFirstOrThrow({ where: { id: locationId, warehouseId } });
  return prisma.location.delete({ where: { id: locationId } });
}
