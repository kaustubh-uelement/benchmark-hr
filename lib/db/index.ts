import "server-only";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";
import { INIT_SQL } from "./init-sql";
import { getDbPath, IS_VERCEL } from "../paths";

export type DB = BetterSQLite3Database<typeof schema>;

function runInitSql(raw: Database.Database) {
  const stmts = INIT_SQL.split("--> statement-breakpoint");
  for (const stmt of stmts) {
    const trimmed = stmt.trim();
    if (trimmed) {
      try {
        raw.exec(trimmed);
      } catch {
        // ignore duplicate index/table errors if any
      }
    }
  }
}

function open(): { db: DB; raw: Database.Database } {
  const dbPath = getDbPath();
  const dir = path.dirname(dbPath);
  fs.mkdirSync(dir, { recursive: true });

  // On Vercel, if a pre-seeded benchmark.db exists in the bundled build, copy it over to /tmp if not already there
  if (IS_VERCEL && !fs.existsSync(dbPath)) {
    const bundledPath = path.join(process.cwd(), "data", "benchmark.db");
    if (fs.existsSync(bundledPath)) {
      try {
        fs.copyFileSync(bundledPath, dbPath);
      } catch (err) {
        console.warn("Failed to copy bundled benchmark.db, will initialize new DB:", err);
      }
    }
  }

  const raw = new Database(dbPath);
  raw.pragma("journal_mode = WAL");
  raw.pragma("foreign_keys = ON");
  raw.pragma("busy_timeout = 5000");
  const db = drizzle(raw, { schema });

  // Ensure tables exist
  const hasBrands = raw.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='brands'").get();
  if (!hasBrands) {
    const migrationsDir = path.join(process.cwd(), "drizzle");
    if (fs.existsSync(migrationsDir)) {
      try {
        migrate(db, { migrationsFolder: migrationsDir });
      } catch {
        runInitSql(raw);
      }
    } else {
      runInitSql(raw);
    }
  }

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
