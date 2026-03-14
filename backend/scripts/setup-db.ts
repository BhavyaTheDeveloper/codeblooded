/**
 * One-command DB setup: create database (if needed), push schema, seed.
 * Only DATABASE_URL is used. Set it in .env to your target DB (e.g. inventory_db).
 * If that database doesn't exist yet, we create it by connecting to "postgres" on the same server.
 */

import "dotenv/config";
import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

function parseUrl(url: string): URL {
  try {
    return new URL(url);
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }
}

function getDatabaseName(parsed: URL): string {
  const path = parsed.pathname.replace(/^\//, "").trim();
  return path || "postgres";
}

function buildConnectionUrl(parsed: URL, database: string): string {
  const u = new URL(parsed.toString());
  u.pathname = `/${database}`;
  return u.toString();
}

async function ensureDatabase(databaseUrl: string): Promise<void> {
  const parsed = parseUrl(databaseUrl);
  const dbName = getDatabaseName(parsed);
  if (dbName === "postgres" || dbName === "template1") {
    console.log("DATABASE_URL points to postgres/template1; skipping create. Use a DB name like inventory_db.");
    return;
  }

  const postgresUrl = buildConnectionUrl(parsed, "postgres");
  const { Client } = await import("pg");
  const client = new Client({ connectionString: postgresUrl });

  try {
    await client.connect();
    const res = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );
    if (res.rows.length === 0) {
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`Created database: ${dbName}`);
    } else {
      console.log(`Database ${dbName} already exists.`);
    }
  } finally {
    await client.end();
  }
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
  let databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl && existsSync(envPath)) {
    const envContent = readFileSync(envPath, "utf-8");
    const match = envContent.match(/DATABASE_URL=(?:"([^"]+)"|(\S+))/);
    if (match) databaseUrl = (match[1] ?? match[2] ?? "").trim();
  }

  if (!databaseUrl) {
    console.error(
      "Set DATABASE_URL in .env. Example:\n  DATABASE_URL=\"postgresql://USER:PASSWORD@HOST:PORT/inventory_db?schema=public\"\n\n" +
        "If inventory_db does not exist, db:setup will create it."
    );
    process.exit(1);
  }

  const urlForConnect = databaseUrl.split("?")[0];
  await ensureDatabase(urlForConnect);

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
