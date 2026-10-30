/**
 * npm run db:seed   — create the database and load demo data if empty
 * npm run db:reset  — wipe every table and reload the demo data
 */
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import fs from "node:fs";
import path from "node:path";
import * as schema from "../lib/db/schema";
import { seed } from "../lib/db/seed";

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "benchmark.db");
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const raw = new Database(DB_PATH);
raw.pragma("journal_mode = WAL");
raw.pragma("foreign_keys = ON");
const db = drizzle(raw, { schema });
migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
const t = Date.now();
seed(db, raw, { reset: process.argv.includes("--reset") });
const count = (t: string) => (raw.prepare(`select count(*) n from ${t}`).get() as { n: number }).n;
console.log(`Database ready at ${DB_PATH} (${Date.now() - t} ms)`);
for (const t of ["brands", "users", "people", "organisations", "mandates", "engagements", "leads", "tickets", "threads", "subscriptions", "payments", "invoices", "jev_runs", "countries", "cities"]) console.log(`  ${t.padEnd(14)} ${count(t)}`);
raw.close();
