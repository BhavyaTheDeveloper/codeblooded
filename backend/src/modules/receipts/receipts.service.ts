import { ReceiptStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import type { CreateReceiptInput, UpdateReceiptInput } from "./receipts.validation.js";
import type { LedgerEntryInput } from "../inventory/ledger.types.js";
import { createLedgerEntries } from "../inventory/ledger.service.js";

const RECEIPT_PREFIX = "RCP";

async function getNextReceiptNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `${RECEIPT_PREFIX}-${year}-`;
  const last = await prisma.receipt.findFirst({
    where: { receiptNumber: { startsWith: prefix } },
    orderBy: { receiptNumber: "desc" },
  });
  const nextNum = last
    ? parseInt(last.receiptNumber.slice(prefix.length), 10) + 1
    : 1;
  return `${prefix}${String(nextNum).padStart(4, "0")}`;
}

export async function createReceipt(data: CreateReceiptInput, createdById: string) {
  const warehouse = await prisma.warehouse.findUniqueOrThrow({ where: { id: data.warehouseId } });
  const receiptNumber = await getNextReceiptNumber();

  const receipt = await prisma.receipt.create({
    data: {
      receiptNumber,
      supplier: data.supplier ?? null,
      warehouseId: data.warehouseId,
      notes: data.notes ?? null,
      createdById,
      status: ReceiptStatus.DRAFT,
      items: {
        create: data.items.map((item) => ({
          productId: item.productId,
          locationId: item.locationId,
          quantity: item.quantity,
          unit: item.unit ?? "UNIT",
        })),
      },
    },
    include: {
      items: { include: { product: true, location: true } },
      warehouse: true,
    },
  });

  for (const item of data.items) {
    const loc = await prisma.location.findFirst({
      where: { id: item.locationId, warehouseId: data.warehouseId },
    });
    if (!loc) {
      throw Object.assign(
        new Error(`Location ${item.locationId} does not belong to warehouse ${data.warehouseId}`),
        { status: 400 }
      );
    }
  }

  return receipt;
}

export async function listReceipts(warehouseId?: string, status?: ReceiptStatus) {
  const where: { warehouseId?: string; status?: ReceiptStatus } = {};
  if (warehouseId) where.warehouseId = warehouseId;
  if (status) where.status = status;

  return prisma.receipt.findMany({
    where,
    include: {
      items: { include: { product: true, location: true } },
      warehouse: true,
      createdBy: { select: { id: true, email: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getReceiptById(id: string) {
  return prisma.receipt.findUniqueOrThrow({
    where: { id },
    include: {
      items: { include: { product: true, location: true } },
      warehouse: true,
      createdBy: { select: { id: true, email: true, name: true } },
    },
  });
}

export async function updateReceipt(id: string, data: UpdateReceiptInput) {
  const receipt = await prisma.receipt.findUniqueOrThrow({
    where: { id },
    include: { items: true },
  });
  if (receipt.status !== ReceiptStatus.DRAFT) {
    throw Object.assign(new Error("Only draft receipts can be updated"), { status: 400 });
  }

  if (data.items) {
    await prisma.receiptItem.deleteMany({ where: { receiptId: id } });
    await prisma.receiptItem.createMany({
      data: data.items.map((item) => ({
        receiptId: id,
        productId: item.productId,
        locationId: item.locationId,
        quantity: item.quantity,
        unit: item.unit ?? "UNIT",
      })),
    });
  }

  return prisma.receipt.update({
    where: { id },
    data: {
      ...(data.supplier !== undefined && { supplier: data.supplier }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
    include: {
      items: { include: { product: true, location: true } },
      warehouse: true,
    },
  });
}

export async function validateReceipt(id: string, userId: string) {
  const receipt = await prisma.receipt.findUniqueOrThrow({
    where: { id },
    include: { items: { include: { product: true, location: true } }, warehouse: true },
  });
  if (receipt.status !== ReceiptStatus.DRAFT) {
    throw Object.assign(new Error("Receipt is already validated"), { status: 400 });
  }

  const ledgerEntries: LedgerEntryInput[] = [];

  for (const item of receipt.items) {
    const inv = await prisma.inventory.upsert({
      where: {
        productId_warehouseId_locationId: {
          productId: item.productId,
          warehouseId: receipt.warehouseId,
          locationId: item.locationId,
        },
      },
      create: {
        productId: item.productId,
        warehouseId: receipt.warehouseId,
        locationId: item.locationId,
        quantity: item.quantity,
      },
      update: { quantity: { increment: item.quantity } },
    });

    ledgerEntries.push({
      documentType: "RECEIPT",
      documentId: receipt.id,
      productId: item.productId,
      warehouseId: receipt.warehouseId,
      locationId: item.locationId,
      quantityDelta: item.quantity,
      quantityAfter: inv.quantity,
      createdById: userId,
    });
  }

  await createLedgerEntries(ledgerEntries);

  await prisma.receipt.update({
    where: { id },
    data: { status: ReceiptStatus.VALIDATED, validatedAt: new Date() },
  });

  return getReceiptById(id);
}
