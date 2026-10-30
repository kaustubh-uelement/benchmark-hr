import "server-only";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";

export type DB = BetterSQLite3Database<typeof schema>;

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "benchmark.db");

function open(): { db: DB; raw: Database.Database } {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const raw = new Database(DB_PATH);
  raw.pragma("journal_mode = WAL");
  raw.pragma("foreign_keys = ON");
  raw.pragma("busy_timeout = 5000");
  const db = drizzle(raw, { schema });
  migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  return { db, raw };
}

const g = globalThis as unknown as { __bhrDb?: { db: DB; raw: Database.Database; seeded?: boolean } };

export function getDb() {
  if (!g.__bhrDb) g.__bhrDb = open();
  if (!g.__bhrDb.seeded) {
    const row = g.__bhrDb.raw.prepare("select count(*) as n from brands").get() as { n: number };
    if (row.n === 0) {
      // First boot: load the demo dataset so every portal has data to show.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { seed } = require("./seed") as typeof import("./seed");
      seed(g.__bhrDb.db, g.__bhrDb.raw);
    }
    g.__bhrDb.seeded = true;
  }
  return g.__bhrDb;
}

export const db = new Proxy({} as DB, {
  get(_t, prop) {
    const real = getDb().db as unknown as Record<string | symbol, unknown>;
    const v = real[prop];
    return typeof v === "function" ? (v as (...a: unknown[]) => unknown).bind(real) : v;
  },
});

export { schema };
