# Inventory Management System — Design Document

## 1. Database Schema Design

### Entity Relationship Overview

```
users ──────────────────────────────────────────────────────────────┐
  │                                                                  │
  ├── receipts (created_by)                                         │
  ├── receipt_items                                                 │
  ├── deliveries (created_by)                                       │
  ├── delivery_items                                                │
  ├── transfers (created_by, from_warehouse, to_warehouse)          │
  ├── transfer_items                                                │
  ├── adjustments (created_by)                                      │
  └── stock_ledger (created_by, document_type references above)     │

categories ── products ── receipt_items / delivery_items / transfer_items
                │                    │
                └── inventory (product + warehouse + location)
                └── stock_ledger (product_id, warehouse_id, location_id)

warehouses ── locations ── inventory
     │                          │
     ├── receipts (warehouse_id)│
     ├── deliveries             │
     ├── transfers (from/to)     │
     ├── adjustments            │
     └── stock_ledger            │
```

### Tables

| Table | Purpose |
|-------|---------|
| **users** | Auth; created_by for audit on all documents |
| **categories** | Product categorization |
| **products** | SKU, name, category, unit, min_stock |
| **warehouses** | Warehouse name, code |
| **locations** | Bins/zones within a warehouse |
| **inventory** | Current stock: product + warehouse + location, quantity |
| **receipts** | Incoming stock header (supplier, status, warehouse) |
| **receipt_items** | Line items: product, quantity, unit |
| **deliveries** | Outgoing stock header (customer, status, warehouse) |
| **delivery_items** | Line items |
| **transfers** | Internal move: from_warehouse, to_warehouse, status |
| **transfer_items** | Line items |
| **adjustments** | Stock correction header (reason, warehouse, status) |
| **adjustment_items** | Product, quantity delta, reason |
| **stock_ledger** | Every movement: document_type, document_id, product, warehouse, location, quantity_delta, balance_after |

### Stock Ledger Rule

- **Every** stock change (receipt validated, delivery validated, transfer validated, adjustment validated) must insert one or more `stock_ledger` rows.
- Each row: `document_type` (RECEIPT | DELIVERY | TRANSFER | ADJUSTMENT), `document_id`, `product_id`, `warehouse_id`, `location_id`, `quantity_delta` (+ or -), `quantity_after`, `created_at`, `created_by`.

---

## 2. Backend Module Structure

```
src/
├── app.ts                 # Express app, middleware
├── server.ts              # Start server
├── config/
│   └── index.ts           # env, db URL
├── shared/
│   ├── middleware/        # auth, errorHandler
│   ├── utils/             # responses, errors
│   └── types/             # common types
└── modules/
    ├── auth/
    │   ├── auth.controller.ts
    │   ├── auth.service.ts
    │   ├── auth.routes.ts
    │   ├── auth.validation.ts
    │   └── auth.types.ts
    ├── products/
    ├── receipts/
    ├── deliveries/
    ├── transfers/
    ├── adjustments/
    ├── inventory/
    ├── dashboard/
    └── warehouses/
```

Each domain module (products, receipts, deliveries, transfers, adjustments, inventory, dashboard, warehouses) follows the same pattern: **controller**, **service**, **routes**, **validation** (Zod), **types**.

---

## 3. API Design (REST)

| Area | Method | Path | Description |
|------|--------|------|-------------|
| Auth | POST | /api/auth/signup | Register |
| Auth | POST | /api/auth/login | Login (JWT) |
| Auth | POST | /api/auth/forgot-password | Request OTP |
| Auth | POST | /api/auth/reset-password | Reset with OTP |
| Products | CRUD | /api/products | + GET ?search=sku&categoryId= |
| Categories | CRUD | /api/categories | |
| Warehouses | CRUD | /api/warehouses | |
| Locations | CRUD | /api/warehouses/:id/locations | |
| Receipts | CRUD | /api/receipts | POST validate/:id to confirm |
| Deliveries | CRUD | /api/deliveries | POST validate/:id to confirm |
| Transfers | CRUD | /api/transfers | POST validate/:id to confirm |
| Adjustments | CRUD | /api/adjustments | POST validate/:id to confirm |
| Inventory | GET | /api/inventory | List with filters (warehouse, product, location) |
| Ledger | GET | /api/inventory/ledger | Audit log with filters |
| Dashboard | GET | /api/dashboard/kpis | KPIs (totals, low stock, pending counts) |
| Dashboard | GET | /api/dashboard/activities | Recent activities / filters |

---

## 4. Frontend Structure

```
src/
├── main.tsx
├── App.tsx
├── api/           # client, endpoints
├── components/    # shared (Button, Table, Sidebar, Card, Filters)
├── hooks/         # useAuth, useQuery helpers
├── pages/
│   ├── Dashboard/
│   ├── Products/
│   ├── Receipts/
│   ├── Deliveries/
│   ├── Transfers/
│   ├── Adjustments/
│   └── Settings (Warehouses, Categories)
└── layouts/
    └── AppLayout.tsx  # sidebar + outlet
```

---

## 5. Document Status Flow

- **Receipts / Deliveries / Transfers / Adjustments**: `DRAFT` → `VALIDATED` (on validate action).
- Only **VALIDATED** documents create inventory changes and **stock_ledger** entries.
