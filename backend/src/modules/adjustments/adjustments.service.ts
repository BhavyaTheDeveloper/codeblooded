import { AdjustmentStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import type { CreateAdjustmentInput, UpdateAdjustmentInput } from "./adjustments.validation.js";
import type { LedgerEntryInput } from "../inventory/ledger.types.js";
import { createLedgerEntries } from "../inventory/ledger.service.js";

const ADJUSTMENT_PREFIX = "ADJ";

async function getNextAdjustmentNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `${ADJUSTMENT_PREFIX}-${year}-`;
  const last = await prisma.adjustment.findFirst({
    where: { adjustmentNumber: { startsWith: prefix } },
    orderBy: { adjustmentNumber: "desc" },
  });
  const nextNum = last ? parseInt(last.adjustmentNumber.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(nextNum).padStart(4, "0")}`;
}

export async function createAdjustment(data: CreateAdjustmentInput, createdById: string) {
  await prisma.warehouse.findUniqueOrThrow({ where: { id: data.warehouseId } });
  const adjustmentNumber = await getNextAdjustmentNumber();

  // Only set createdById if the user actually exists to avoid FK errors
  const creator = createdById ? await prisma.user.findUnique({ where: { id: createdById } }) : null;
  const safeCreatedById = creator?.id;

  return prisma.adjustment.create({
    data: {
      adjustmentNumber,
      warehouseId: data.warehouseId,
      reason: data.reason,
      notes: data.notes ?? null,
      ...(safeCreatedById && { createdById: safeCreatedById }),
      status: AdjustmentStatus.DRAFT,
      items: {
        create: data.items.map((item) => ({
          productId: item.productId,
          locationId: item.locationId,
          quantityDelta: item.quantityDelta,
          reason: item.reason ?? null,
        })),
      },
    },
    include: {
      items: { include: { product: true, location: true } },
      warehouse: true,
    },
  });
}

export async function listAdjustments(warehouseId?: string, status?: AdjustmentStatus) {
  const where: { warehouseId?: string; status?: AdjustmentStatus } = {};
  if (warehouseId) where.warehouseId = warehouseId;
  if (status) where.status = status;

  return prisma.adjustment.findMany({
    where,
    include: {
      items: { include: { product: true, location: true } },
      warehouse: true,
      createdBy: { select: { id: true, email: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAdjustmentById(id: string) {
  return prisma.adjustment.findUniqueOrThrow({
    where: { id },
    include: {
      items: { include: { product: true, location: true } },
      warehouse: true,
      createdBy: { select: { id: true, email: true, name: true } },
    },
  });
}

export async function updateAdjustment(id: string, data: UpdateAdjustmentInput) {
  const adjustment = await prisma.adjustment.findUniqueOrThrow({ where: { id } });
  if (adjustment.status !== AdjustmentStatus.DRAFT) {
    throw Object.assign(new Error("Only draft adjustments can be updated"), { status: 400 });
  }

  if (data.items) {
    await prisma.adjustmentItem.deleteMany({ where: { adjustmentId: id } });
    await prisma.adjustmentItem.createMany({
      data: data.items.map((item) => ({
        adjustmentId: id,
        productId: item.productId,
        locationId: item.locationId,
        quantityDelta: item.quantityDelta,
        reason: item.reason ?? null,
      })),
    });
  }

  return prisma.adjustment.update({
    where: { id },
    data: {
      ...(data.reason !== undefined && { reason: data.reason }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
    include: {
      items: { include: { product: true, location: true } },
      warehouse: true,
    },
  });
}

export async function validateAdjustment(id: string, userId: string) {
  const adjustment = await prisma.adjustment.findUniqueOrThrow({
    where: { id },
    include: {
      items: { include: { product: true, location: true } },
      warehouse: true,
    },
  });
  if (adjustment.status !== AdjustmentStatus.DRAFT) {
    throw Object.assign(new Error("Adjustment is already validated"), { status: 400 });
  }

  const ledgerEntries: LedgerEntryInput[] = [];

  for (const item of adjustment.items) {
    const existing = await prisma.inventory.findUnique({
      where: {
        productId_warehouseId_locationId: {
          productId: item.productId,
          warehouseId: adjustment.warehouseId,
          locationId: item.locationId,
        },
      },
    });
    if (!existing && item.quantityDelta < 0) {
      throw Object.assign(
        new Error(
          `Cannot apply negative adjustment for product ${item.product.sku} at location ${item.location.code}: no existing stock`
        ),
        { status: 400 }
      );
    }
    const inv = await prisma.inventory.upsert({
      where: {
        productId_warehouseId_locationId: {
          productId: item.productId,
          warehouseId: adjustment.warehouseId,
          locationId: item.locationId,
        },
      },
      create: {
        productId: item.productId,
        warehouseId: adjustment.warehouseId,
        locationId: item.locationId,
        quantity: item.quantityDelta > 0 ? item.quantityDelta : 0,
      },
      update: { quantity: { increment: item.quantityDelta } },
    });
    if (inv.quantity < 0) {
      throw Object.assign(
        new Error(
          `Adjustment would result in negative stock for product ${item.product.sku} at location ${item.location.code}`
        ),
        { status: 400 }
      );
    }

    ledgerEntries.push({
      documentType: "ADJUSTMENT",
      documentId: adjustment.id,
      productId: item.productId,
      warehouseId: adjustment.warehouseId,
      locationId: item.locationId,
      quantityDelta: item.quantityDelta,
      quantityAfter: inv.quantity,
      createdById: userId,
    });
  }

  await createLedgerEntries(ledgerEntries);

  await prisma.adjustment.update({
    where: { id },
    data: { status: AdjustmentStatus.VALIDATED, validatedAt: new Date() },
  });

  return getAdjustmentById(id);
}
