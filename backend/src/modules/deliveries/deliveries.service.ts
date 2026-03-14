import { DeliveryStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import type { CreateDeliveryInput, UpdateDeliveryInput } from "./deliveries.validation.js";
import type { LedgerEntryInput } from "../inventory/ledger.types.js";
import { createLedgerEntries } from "../inventory/ledger.service.js";

const DELIVERY_PREFIX = "DO";

async function getNextDeliveryNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `${DELIVERY_PREFIX}-${year}-`;
  const last = await prisma.delivery.findFirst({
    where: { deliveryNumber: { startsWith: prefix } },
    orderBy: { deliveryNumber: "desc" },
  });
  const nextNum = last ? parseInt(last.deliveryNumber.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(nextNum).padStart(4, "0")}`;
}

export async function createDelivery(data: CreateDeliveryInput, createdById: string) {
  await prisma.warehouse.findUniqueOrThrow({ where: { id: data.warehouseId } });
  const deliveryNumber = await getNextDeliveryNumber();

  // Only set createdById if the user actually exists to avoid FK errors
  const creator = createdById ? await prisma.user.findUnique({ where: { id: createdById } }) : null;
  const safeCreatedById = creator?.id;

  return prisma.delivery.create({
    data: {
      deliveryNumber,
      customer: data.customer ?? null,
      warehouseId: data.warehouseId,
      notes: data.notes ?? null,
      ...(safeCreatedById && { createdById: safeCreatedById }),
      status: DeliveryStatus.DRAFT,
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
}

export async function listDeliveries(warehouseId?: string, status?: DeliveryStatus) {
  const where: { warehouseId?: string; status?: DeliveryStatus } = {};
  if (warehouseId) where.warehouseId = warehouseId;
  if (status) where.status = status;

  return prisma.delivery.findMany({
    where,
    include: {
      items: { include: { product: true, location: true } },
      warehouse: true,
      createdBy: { select: { id: true, email: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getDeliveryById(id: string) {
  return prisma.delivery.findUniqueOrThrow({
    where: { id },
    include: {
      items: { include: { product: true, location: true } },
      warehouse: true,
      createdBy: { select: { id: true, email: true, name: true } },
    },
  });
}

export async function updateDelivery(id: string, data: UpdateDeliveryInput) {
  const delivery = await prisma.delivery.findUniqueOrThrow({ where: { id } });
  if (delivery.status !== DeliveryStatus.DRAFT) {
    throw Object.assign(new Error("Only draft deliveries can be updated"), { status: 400 });
  }

  if (data.items) {
    await prisma.deliveryItem.deleteMany({ where: { deliveryId: id } });
    await prisma.deliveryItem.createMany({
      data: data.items.map((item) => ({
        deliveryId: id,
        productId: item.productId,
        locationId: item.locationId,
        quantity: item.quantity,
        unit: item.unit ?? "UNIT",
      })),
    });
  }

  return prisma.delivery.update({
    where: { id },
    data: {
      ...(data.customer !== undefined && { customer: data.customer }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
    include: {
      items: { include: { product: true, location: true } },
      warehouse: true,
    },
  });
}

export async function updateDeliveryStatus(id: string, status: DeliveryStatus) {
  const delivery = await prisma.delivery.findUniqueOrThrow({ where: { id } });
  if (delivery.status === DeliveryStatus.VALIDATED) {
    throw Object.assign(new Error("Cannot change status of validated delivery"), { status: 400 });
  }
  return prisma.delivery.update({
    where: { id },
    data: { status },
    include: { items: true, warehouse: true },
  });
}

export async function validateDelivery(id: string, userId: string) {
  const delivery = await prisma.delivery.findUniqueOrThrow({
    where: { id },
    include: { items: { include: { product: true, location: true } }, warehouse: true },
  });
  if (delivery.status === DeliveryStatus.VALIDATED) {
    throw Object.assign(new Error("Delivery is already validated"), { status: 400 });
  }

  const ledgerEntries: LedgerEntryInput[] = [];

  for (const item of delivery.items) {
    const inv = await prisma.inventory.findUnique({
      where: {
        productId_warehouseId_locationId: {
          productId: item.productId,
          warehouseId: delivery.warehouseId,
          locationId: item.locationId,
        },
      },
    });
    if (!inv || inv.quantity < item.quantity) {
      throw Object.assign(
        new Error(
          `Insufficient stock for product ${item.product.sku} at location ${item.location.code}. Available: ${inv?.quantity ?? 0}, required: ${item.quantity}`
        ),
        { status: 400 }
      );
    }

    const updated = await prisma.inventory.update({
      where: {
        productId_warehouseId_locationId: {
          productId: item.productId,
          warehouseId: delivery.warehouseId,
          locationId: item.locationId,
        },
      },
      data: { quantity: { decrement: item.quantity } },
    });

    ledgerEntries.push({
      documentType: "DELIVERY",
      documentId: delivery.id,
      productId: item.productId,
      warehouseId: delivery.warehouseId,
      locationId: item.locationId,
      quantityDelta: -item.quantity,
      quantityAfter: updated.quantity,
      createdById: userId,
    });
  }

  await createLedgerEntries(ledgerEntries);

  await prisma.delivery.update({
    where: { id },
    data: { status: DeliveryStatus.VALIDATED, validatedAt: new Date() },
  });

  return getDeliveryById(id);
}
