import { TransferStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import type { CreateTransferInput, UpdateTransferInput } from "./transfers.validation.js";
import type { LedgerEntryInput } from "../inventory/ledger.types.js";
import { createLedgerEntries } from "../inventory/ledger.service.js";

const TRANSFER_PREFIX = "TRF";

async function getNextTransferNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `${TRANSFER_PREFIX}-${year}-`;
  const last = await prisma.transfer.findFirst({
    where: { transferNumber: { startsWith: prefix } },
    orderBy: { transferNumber: "desc" },
  });
  const nextNum = last ? parseInt(last.transferNumber.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(nextNum).padStart(4, "0")}`;
}

export async function createTransfer(data: CreateTransferInput, createdById: string) {
  await prisma.warehouse.findUniqueOrThrow({ where: { id: data.fromWarehouseId } });
  await prisma.warehouse.findUniqueOrThrow({ where: { id: data.toWarehouseId } });
  const transferNumber = await getNextTransferNumber();

  // Only set createdById if the user actually exists to avoid FK errors
  const creator = createdById ? await prisma.user.findUnique({ where: { id: createdById } }) : null;
  const safeCreatedById = creator?.id;

  return prisma.transfer.create({
    data: {
      transferNumber,
      fromWarehouseId: data.fromWarehouseId,
      toWarehouseId: data.toWarehouseId,
      notes: data.notes ?? null,
      ...(safeCreatedById && { createdById: safeCreatedById }),
      status: TransferStatus.DRAFT,
      items: {
        create: data.items.map((item) => ({
          productId: item.productId,
          fromLocationId: item.fromLocationId,
          toLocationId: item.toLocationId,
          quantity: item.quantity,
          unit: item.unit ?? "UNIT",
        })),
      },
    },
    include: {
      items: { include: { product: true, fromLocation: true, toLocation: true } },
      fromWarehouse: true,
      toWarehouse: true,
    },
  });
}

export async function listTransfers(filters?: { fromWarehouseId?: string; toWarehouseId?: string; status?: TransferStatus }) {
  const where: { fromWarehouseId?: string; toWarehouseId?: string; status?: TransferStatus } = {};
  if (filters?.fromWarehouseId) where.fromWarehouseId = filters.fromWarehouseId;
  if (filters?.toWarehouseId) where.toWarehouseId = filters.toWarehouseId;
  if (filters?.status) where.status = filters.status;

  return prisma.transfer.findMany({
    where,
    include: {
      items: { include: { product: true, fromLocation: true, toLocation: true } },
      fromWarehouse: true,
      toWarehouse: true,
      createdBy: { select: { id: true, email: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getTransferById(id: string) {
  return prisma.transfer.findUniqueOrThrow({
    where: { id },
    include: {
      items: { include: { product: true, fromLocation: true, toLocation: true } },
      fromWarehouse: true,
      toWarehouse: true,
      createdBy: { select: { id: true, email: true, name: true } },
    },
  });
}

export async function updateTransfer(id: string, data: UpdateTransferInput) {
  const transfer = await prisma.transfer.findUniqueOrThrow({ where: { id } });
  if (transfer.status !== TransferStatus.DRAFT) {
    throw Object.assign(new Error("Only draft transfers can be updated"), { status: 400 });
  }

  if (data.items) {
    await prisma.transferItem.deleteMany({ where: { transferId: id } });
    await prisma.transferItem.createMany({
      data: data.items.map((item) => ({
        transferId: id,
        productId: item.productId,
        fromLocationId: item.fromLocationId,
        toLocationId: item.toLocationId,
        quantity: item.quantity,
        unit: item.unit ?? "UNIT",
      })),
    });
  }

  return prisma.transfer.update({
    where: { id },
    data: { ...(data.notes !== undefined && { notes: data.notes }) },
    include: {
      items: { include: { product: true, fromLocation: true, toLocation: true } },
      fromWarehouse: true,
      toWarehouse: true,
    },
  });
}

export async function validateTransfer(id: string, userId: string) {
  const transfer = await prisma.transfer.findUniqueOrThrow({
    where: { id },
    include: {
      items: { include: { product: true, fromLocation: true, toLocation: true } },
      fromWarehouse: true,
      toWarehouse: true,
    },
  });
  if (transfer.status !== TransferStatus.DRAFT) {
    throw Object.assign(new Error("Transfer is already validated"), { status: 400 });
  }

  const ledgerEntries: LedgerEntryInput[] = [];

  for (const item of transfer.items) {
    const fromInv = await prisma.inventory.findUnique({
      where: {
        productId_warehouseId_locationId: {
          productId: item.productId,
          warehouseId: transfer.fromWarehouseId,
          locationId: item.fromLocationId,
        },
      },
    });
    if (!fromInv || fromInv.quantity < item.quantity) {
      throw Object.assign(
        new Error(
          `Insufficient stock for product ${item.product.sku} at source location. Available: ${fromInv?.quantity ?? 0}, required: ${item.quantity}`
        ),
        { status: 400 }
      );
    }

    const fromUpdated = await prisma.inventory.update({
      where: {
        productId_warehouseId_locationId: {
          productId: item.productId,
          warehouseId: transfer.fromWarehouseId,
          locationId: item.fromLocationId,
        },
      },
      data: { quantity: { decrement: item.quantity } },
    });

    ledgerEntries.push({
      documentType: "TRANSFER",
      documentId: transfer.id,
      productId: item.productId,
      warehouseId: transfer.fromWarehouseId,
      locationId: item.fromLocationId,
      quantityDelta: -item.quantity,
      quantityAfter: fromUpdated.quantity,
      createdById: userId,
    });

    const toInv = await prisma.inventory.upsert({
      where: {
        productId_warehouseId_locationId: {
          productId: item.productId,
          warehouseId: transfer.toWarehouseId,
          locationId: item.toLocationId,
        },
      },
      create: {
        productId: item.productId,
        warehouseId: transfer.toWarehouseId,
        locationId: item.toLocationId,
        quantity: item.quantity,
      },
      update: { quantity: { increment: item.quantity } },
    });

    ledgerEntries.push({
      documentType: "TRANSFER",
      documentId: transfer.id,
      productId: item.productId,
      warehouseId: transfer.toWarehouseId,
      locationId: item.toLocationId,
      quantityDelta: item.quantity,
      quantityAfter: toInv.quantity,
      createdById: userId,
    });
  }

  await createLedgerEntries(ledgerEntries);

  await prisma.transfer.update({
    where: { id },
    data: { status: TransferStatus.VALIDATED, validatedAt: new Date() },
  });

  return getTransferById(id);
}
