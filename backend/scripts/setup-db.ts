/**
 * One-command DB setup: create database (if needed), push schema, seed.
 * Usage:
 *   Set SERVER_URL or DATABASE_URL in .env, then: npm run db:setup
 *   Or: SERVER_URL="postgresql://user:pass@host:5432/postgres" npm run db:setup
 *
 * SERVER_URL = postgres server link → we create inventory_db and use it.
 * DATABASE_URL = full link to your DB → we only push + seed (no create).
 */

import "dotenv/config";
import { execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const DB_NAME = "inventory_db";

function parseUrl(url: string): URL {
  try {
    return new URL(url);
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }
}

function buildConnectionUrl(parsed: URL, database: string): string {
  const u = new URL(parsed.toString());
  u.pathname = `/${database}`;
  return u.toString();
}

async function ensureDatabase(serverUrl: string): Promise<string> {
  const parsed = parseUrl(serverUrl);
  const dbFromPath = parsed.pathname.replace(/^\//, "").trim() || "postgres";
  const adminDb = dbFromPath === DB_NAME ? "postgres" : dbFromPath;
  const adminUrl = buildConnectionUrl(parsed, adminDb);

  const { Client } = await import("pg");
  const client = new Client({ connectionString: adminUrl });

  try {
    await client.connect();
    const res = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [DB_NAME]
    );
    if (res.rows.length === 0) {
      await client.query(`CREATE DATABASE ${DB_NAME}`);
      console.log(`Created database: ${DB_NAME}`);
    } else {
      console.log(`Database ${DB_NAME} already exists.`);
    }
  } finally {
    await client.end();
  }

  return buildConnectionUrl(parsed, DB_NAME);
}

function run(cmd: string, env: NodeJS.ProcessEnv = {}): void {
  execSync(cmd, {
    stdio: "inherit",
    env: { ...process.env, ...env },
    cwd: process.cwd(),
  });
}

async function main(): Promise<void> {
  const envPath = join(process.cwd(), ".env");
  let envContent = existsSync(envPath) ? readFileSync(envPath, "utf-8") : "";

  let databaseUrl = process.env.DATABASE_URL;
  const serverUrl = process.env.SERVER_URL;

  if (serverUrl) {
    console.log("Using SERVER_URL to create database...");
    databaseUrl = await ensureDatabase(serverUrl);
    if (!envContent.includes("DATABASE_URL=")) {
      envContent += `\nDATABASE_URL="${databaseUrl}?schema=public"\n`;
    } else {
      envContent = envContent.replace(
        /DATABASE_URL=.*/,
        `DATABASE_URL="${databaseUrl}?schema=public"`
      );
    }
    writeFileSync(envPath, envContent.trimEnd() + "\n", "utf-8");
    console.log("Updated .env with DATABASE_URL.");
  } else if (envContent) {
    const match = envContent.match(/DATABASE_URL=(?:"([^"]+)"|(\S+))/);
    if (match) databaseUrl = databaseUrl ?? match[1] ?? match[2];
  }

  if (!databaseUrl) {
    console.error(
      "Set SERVER_URL or DATABASE_URL in .env (or environment).\n\n" +
        "Examples:\n" +
        "  SERVER_URL=postgresql://user:password@localhost:5432/postgres\n" +
        "  DATABASE_URL=postgresql://user:password@localhost:5432/inventory_db?schema=public"
    );
    process.exit(1);
  }

  if (!databaseUrl.includes("?")) {
    databaseUrl = databaseUrl + "?schema=public";
  }

  console.log("Pushing schema (Prisma db push)...");
  run("npx prisma db push", { DATABASE_URL: databaseUrl });

  console.log("Seeding data...");
  run("npx tsx prisma/seed.ts", { DATABASE_URL: databaseUrl });

  console.log("\nDone. Database is ready. Run: npm run dev");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
