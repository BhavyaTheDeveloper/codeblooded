# Step-by-step setup guide (newbie-friendly)

This guide walks you through running the Inventory Management project from scratch, including setting up PostgreSQL with pgAdmin.

---

## Prerequisites

- **Node.js** (v18 or newer). Check: open Terminal and run `node -v`. If not installed, download from [nodejs.org](https://nodejs.org).
- **PostgreSQL** (comes with pgAdmin when you install the “PostgreSQL + pgAdmin” stack). If you have pgAdmin, PostgreSQL is usually already installed.
- **npm** (comes with Node.js). Check: `npm -v`.

---

## Part 1: Set up the PostgreSQL database

### Step 1.1: Open pgAdmin

1. Open **pgAdmin** from your applications.
2. In the left sidebar, expand **Servers**.
3. Click your **PostgreSQL** server (e.g. “PostgreSQL 15” or “localhost”).
4. When prompted, enter the **master password** you set when you installed PostgreSQL. (If you never set one, try leaving it blank or check your installer notes.)

### Step 1.2: Create a new database

1. **Right‑click** on **Databases** (under your server).
2. Choose **Create** → **Database…**.
3. In the **Database** field, type: `inventory_db`.
4. Leave **Owner** as default (often your Windows/macOS user or `postgres`).
5. Click **Save**.

You should now see `inventory_db` under **Databases**.

### Step 1.3: Get your connection details

You need a **connection string** for the backend. It looks like:

```text
postgresql://USERNAME:PASSWORD@localhost:5432/inventory_db
```

- **USERNAME**: Usually `postgres` (or the user you use in pgAdmin).
- **PASSWORD**: The password you use to connect to PostgreSQL in pgAdmin.
- **localhost**: Server address (same machine).
- **5432**: Default PostgreSQL port.
- **inventory_db**: The database you just created.

To confirm the port in pgAdmin: right‑click your server → **Properties** → **Connection** tab; “Port” is usually **5432**.

**Example:**  
If user is `postgres` and password is `mypassword`, the URL is:

```text
postgresql://postgres:mypassword@localhost:5432/inventory_db
```

If your password has special characters (e.g. `@`, `#`, `%`), you may need to **URL‑encode** them or use a simple password for local dev.

---

## Part 2: Set up the backend

### Step 2.1: Open Terminal in the project folder

1. Open your project in VS Code (or any editor).
2. Open the integrated terminal: **Terminal** → **New Terminal** (or `` Ctrl+` `` / `` Cmd+` ``).
3. Make sure you’re in the project root (the folder that contains `backend` and `frontend`).

### Step 2.2: Go to the backend folder

```bash
cd backend
```

### Step 2.3: Create the `.env` file

1. Copy the example env file:
   - **Windows (PowerShell):** `Copy-Item .env.example .env`
   - **Mac/Linux:** `cp .env.example .env`
2. Open the **`backend/.env`** file in your editor.
3. Set **DATABASE_URL** to your real connection string (from Step 1.3):

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD_HERE@localhost:5432/inventory_db?schema=public"
```

Replace `YOUR_PASSWORD_HERE` with your actual PostgreSQL password.

4. Optionally set **JWT_SECRET** to any long random string (e.g. `my-super-secret-key-12345`). For local use the default is fine.
5. Save the file.

### Step 2.4: Install backend dependencies

In the same terminal (still in `backend`):

```bash
npm install
```

Wait until it finishes without errors.

### Step 2.5: Create database tables (Prisma)

Run:

```bash
npx prisma db push
```

You should see something like: “Your database is now in sync with your schema.”  
In pgAdmin you can refresh **inventory_db** → **Schemas** → **public** → **Tables** and you’ll see the new tables.

### Step 2.6: Add seed data (optional but useful)

```bash
npm run db:seed
```

You should see: “Seed completed: …”  
This creates an admin user and sample categories, warehouses, products, and stock.

### Step 2.7: Start the backend server

```bash
npm run dev
```

You should see: **“Server running on http://localhost:4000”**.  
Leave this terminal open.

**Quick test:** Open a browser and go to: **http://localhost:4000/health**  
You should get something like `{"ok":true}`.

---

## Part 3: Set up the frontend

### Step 3.1: Open a second terminal

- **VS Code:** **Terminal** → **New Terminal** (or split the existing one).
- Make sure you’re in the **project root** (not inside `backend`). If needed:

```bash
cd "path/to/Inventory Management Project"
```

(Replace with your actual project path.)

### Step 3.2: Go to the frontend folder

```bash
cd frontend
```

### Step 3.3: Install frontend dependencies

```bash
npm install
```

Wait until it finishes.

### Step 3.4: Start the frontend dev server

```bash
npm run dev
```

You should see something like: **“Local: http://localhost:5173/”**.

### Step 3.5: Open the app

In your browser go to: **http://localhost:5173**

You should see the login page.

---

## Part 4: Log in and use the app

1. **If you ran the seed:**  
   - Email: `admin@example.com`  
   - Password: `password123`

2. **If you didn’t seed:**  
   - Click **Sign up**, create an account, then sign in.

3. After login you’ll see the **Dashboard** with KPIs and the sidebar (Products, Receipts, Deliveries, etc.).

---

## Summary checklist

| Step | Where | Command / Action |
|------|--------|-------------------|
| 1 | pgAdmin | Create database `inventory_db` |
| 2 | `backend/.env` | Set `DATABASE_URL` with your PostgreSQL user and password |
| 3 | Terminal in `backend` | `npm install` |
| 4 | Terminal in `backend` | `npx prisma db push` |
| 5 | Terminal in `backend` | `npm run db:seed` |
| 6 | Terminal in `backend` | `npm run dev` (keep running) |
| 7 | New terminal in `frontend` | `npm install` |
| 8 | Same terminal in `frontend` | `npm run dev` (keep running) |
| 9 | Browser | Open http://localhost:5173 and log in |

---

## Common issues

### “Connection refused” or “password authentication failed”

- Check that PostgreSQL is running (e.g. in pgAdmin, the server shows a green icon or connects successfully).
- In `backend/.env`, double‑check **username**, **password**, **port (5432)**, and database name **inventory_db**.
- On Mac with Homebrew PostgreSQL, sometimes the user is your Mac username; try that if `postgres` fails.

### “Port 4000 already in use”

- Another app is using port 4000. Either close it or change **PORT** in `backend/.env` (e.g. to `4001`) and use that URL for the API.

### “Port 5173 already in use”

- Vite will usually offer another port (e.g. 5174). Use the URL shown in the terminal.

### Frontend shows “Failed to load” or network errors

- Ensure the **backend** is running on http://localhost:4000 and that http://localhost:4000/health works.
- The frontend is set to proxy `/api` to the backend; use http://localhost:5173 (not 4000) to open the app.

### I don’t have PostgreSQL / pgAdmin

- **Windows:** Install “PostgreSQL” from [postgresql.org](https://www.postgresql.org/download/windows/); during setup you can include “pgAdmin”.
- **Mac:** Install PostgreSQL (e.g. from [postgresql.org](https://www.postgresql.org/download/mac/) or with Homebrew: `brew install postgresql`), then install pgAdmin from [pgadmin.org](https://www.pgadmin.org/download/).

---

## Next time you work on the project

1. Start PostgreSQL (if it’s not running as a service).
2. In a terminal: `cd backend` → `npm run dev`.
3. In another terminal: `cd frontend` → `npm run dev`.
4. Open http://localhost:5173 in your browser.

That’s it.
