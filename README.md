# Inventory Management System

Production-quality modular warehouse inventory application (Node.js + React).

## Overview

- **Backend**: Node.js, Express, TypeScript, Prisma, PostgreSQL, Zod
- **Frontend**: React, Vite, TypeScript, TailwindCSS, TanStack Query, React Router
- **Architecture**: Modular backend (auth, products, receipts, deliveries, transfers, adjustments, inventory, dashboard, warehouses); every stock movement creates a **stock ledger** entry for audit.

## First-time setup (detailed)

**New to the project or PostgreSQL?** Use the step-by-step guide: **[docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md)**. It covers:

- Creating the database in **pgAdmin**
- Getting the connection string (username, password, port)
- Backend and frontend setup, seed data, and login
- Common issues (connection refused, port in use, etc.)

---

## Quick start

### 1. Backend (one-command DB setup)

```bash
cd backend
cp .env.example .env
```

Edit `.env`: set **SERVER_URL** to your PostgreSQL server (e.g. `postgresql://user:password@localhost:5432/postgres`). The setup script will create `inventory_db` for you.

```bash
npm install
npm run db:setup
npm run dev
```

`db:setup` creates the database (if needed), pushes the schema, and seeds data. You can run it again anytime without deleting the DB; seed is safe to re-run.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

API runs at **http://localhost:4000**. Health: `GET /health`. App at **http://localhost:5173** (proxies `/api` to backend).

### 3. Login

After seeding, you can sign up a new user or use the seed admin:

- **Email**: `admin@example.com`
- **Password**: `password123`

## Project structure

```
backend/
  prisma/schema.prisma   # PostgreSQL schema
  prisma/seed.ts         # Seed data
  src/
    config/
    lib/prisma.ts
    shared/              # middleware, utils, types
    modules/
      auth/
      products/
      categories/
      warehouses/
      receipts/
      deliveries/
      transfers/
      adjustments/
      inventory/         # list + ledger
      dashboard/

frontend/
  src/
    api/                 # client + endpoints
    contexts/            # AuthContext
    layouts/             # AppLayout (sidebar)
    components/          # Card, DataTable
    pages/              # Dashboard, Products, Receipts, etc.
```

## API summary

| Area        | Endpoints |
|------------|-----------|
| Auth       | POST `/api/auth/signup`, `/api/auth/login`, `/api/auth/forgot-password`, `/api/auth/reset-password` |
| Categories | CRUD `/api/categories` |
| Products   | CRUD `/api/products` (query: `search`, `categoryId`) |
| Warehouses | CRUD `/api/warehouses`, `/api/warehouses/:id/locations` |
| Receipts   | CRUD `/api/receipts`, POST `/api/receipts/:id/validate` |
| Deliveries | CRUD `/api/deliveries`, PATCH status, POST validate |
| Transfers  | CRUD `/api/transfers`, POST validate |
| Adjustments| CRUD `/api/adjustments`, POST validate |
| Inventory  | GET `/api/inventory`, GET `/api/inventory/ledger` |
| Dashboard  | GET `/api/dashboard/kpis`, `/api/dashboard/activities` |

See **docs/API_EXAMPLES.md** for example `curl` requests.

## Design

- **docs/DESIGN.md** – Database schema, module layout, API design, document status flow.

## Rules

- All mutation endpoints (except auth) require `Authorization: Bearer <token>`.
- Only **DRAFT** documents can be updated.
- **Validate** on receipts/deliveries/transfers/adjustments applies stock changes and writes to the **stock_ledger**.
