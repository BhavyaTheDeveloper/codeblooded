import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const user = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      passwordHash,
      name: "Admin User",
      role: "ADMIN",
    },
  });

  const categoryElectronics =
    (await prisma.category.findFirst({ where: { name: "Electronics" } })) ??
    (await prisma.category.create({
      data: { name: "Electronics", description: "Electronic items" },
    }));

  const categoryOffice =
    (await prisma.category.findFirst({ where: { name: "Office Supplies" } })) ??
    (await prisma.category.create({
      data: { name: "Office Supplies", description: "Office and stationery" },
    }));

  const whMain = await prisma.warehouse.upsert({
    where: { code: "WH-MAIN" },
    update: {},
    create: {
      code: "WH-MAIN",
      name: "Main Warehouse",
      address: "123 Storage Ave",
    },
  });

  const whSecondary = await prisma.warehouse.upsert({
    where: { code: "WH-SEC" },
    update: {},
    create: {
      code: "WH-SEC",
      name: "Secondary Warehouse",
      address: "456 Depot Rd",
    },
  });

  const locA1 = await prisma.location.upsert({
    where: { warehouseId_code: { warehouseId: whMain.id, code: "A-01" } },
    update: {},
    create: { warehouseId: whMain.id, code: "A-01", name: "Aisle A, Shelf 1" },
  });

  const locA2 = await prisma.location.upsert({
    where: { warehouseId_code: { warehouseId: whMain.id, code: "A-02" } },
    update: {},
    create: { warehouseId: whMain.id, code: "A-02", name: "Aisle A, Shelf 2" },
  });

  const locB1 = await prisma.location.upsert({
    where: { warehouseId_code: { warehouseId: whSecondary.id, code: "B-01" } },
    update: {},
    create: { warehouseId: whSecondary.id, code: "B-01", name: "Aisle B, Shelf 1" },
  });

  const product1 = await prisma.product.upsert({
    where: { sku: "SKU-001" },
    update: {},
    create: {
      sku: "SKU-001",
      name: "Widget Pro",
      description: "High-quality widget",
      unit: "UNIT",
      minStock: 10,
      categoryId: categoryElectronics.id,
    },
  });

  const product2 = await prisma.product.upsert({
    where: { sku: "SKU-002" },
    update: {},
    create: {
      sku: "SKU-002",
      name: "Gadget Basic",
      description: "Basic gadget",
      unit: "UNIT",
      minStock: 5,
      categoryId: categoryElectronics.id,
    },
  });

  const product3 = await prisma.product.upsert({
    where: { sku: "SKU-003" },
    update: {},
    create: {
      sku: "SKU-003",
      name: "Notebook A4",
      unit: "UNIT",
      minStock: 20,
      categoryId: categoryOffice.id,
    },
  });

  await prisma.inventory.upsert({
    where: {
      productId_warehouseId_locationId: {
        productId: product1.id,
        warehouseId: whMain.id,
        locationId: locA1.id,
      },
    },
    update: { quantity: 100 },
    create: {
      productId: product1.id,
      warehouseId: whMain.id,
      locationId: locA1.id,
      quantity: 100,
    },
  });

  await prisma.inventory.upsert({
    where: {
      productId_warehouseId_locationId: {
        productId: product2.id,
        warehouseId: whMain.id,
        locationId: locA2.id,
      },
    },
    update: { quantity: 50 },
    create: {
      productId: product2.id,
      warehouseId: whMain.id,
      locationId: locA2.id,
      quantity: 50,
    },
  });

  await prisma.inventory.upsert({
    where: {
      productId_warehouseId_locationId: {
        productId: product3.id,
        warehouseId: whMain.id,
        locationId: locA1.id,
      },
    },
    update: { quantity: 200 },
    create: {
      productId: product3.id,
      warehouseId: whMain.id,
      locationId: locA1.id,
      quantity: 200,
    },
  });

  console.log("Seed completed:", {
    user: user.email,
    categories: 2,
    warehouses: 2,
    locations: 3,
    products: 3,
    inventory: 3,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
