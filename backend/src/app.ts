import express from "express";
import cors from "cors";
import { errorHandler } from "./shared/middleware/errorHandler.middleware.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { productRoutes } from "./modules/products/products.routes.js";
import { categoryRoutes } from "./modules/categories/categories.routes.js";
import { warehouseRoutes } from "./modules/warehouses/warehouses.routes.js";
import { receiptRoutes } from "./modules/receipts/receipts.routes.js";
import { deliveryRoutes } from "./modules/deliveries/deliveries.routes.js";
import { transferRoutes } from "./modules/transfers/transfers.routes.js";
import { adjustmentRoutes } from "./modules/adjustments/adjustments.routes.js";
import { inventoryRoutes } from "./modules/inventory/inventory.routes.js";
import { dashboardRoutes } from "./modules/dashboard/dashboard.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/warehouses", warehouseRoutes);
app.use("/api/receipts", receiptRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/transfers", transferRoutes);
app.use("/api/adjustments", adjustmentRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use(errorHandler);

export default app;
