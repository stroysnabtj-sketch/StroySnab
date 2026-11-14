import { mkdir } from "node:fs/promises";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";
import { citext } from "@electric-sql/pglite/contrib/citext";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { drizzle as drizzleNode, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate as migrateNode } from "drizzle-orm/node-postgres/migrator";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { Pool } from "pg";
import * as schema from "./schema";

export type AppDatabase = NodePgDatabase<typeof schema>;
export type DbTransaction = Parameters<Parameters<AppDatabase["transaction"]>[0]>[0];
export type DbExecutor = AppDatabase | DbTransaction;

type DatabaseGlobal = typeof globalThis & {
  __kushoniyonDb?: AppDatabase;
  __kushoniyonInit?: Promise<AppDatabase>;
  __kushoniyonPglite?: PGlite;
  __kushoniyonPool?: Pool;
};
const globalDb = globalThis as DatabaseGlobal;

async function initialize(): Promise<AppDatabase> {
  const migrationsFolder = path.join(process.cwd(), "drizzle");
  if (process.env.DATABASE_URL) {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
    const database = drizzleNode(pool, { schema });
    const migrationLock = await pool.connect();
    try {
      await migrationLock.query("SELECT pg_advisory_lock(hashtext('stroysnab-schema-migrations'))");
      await migrateNode(database, { migrationsFolder });
    } finally {
      await migrationLock
        .query("SELECT pg_advisory_unlock(hashtext('stroysnab-schema-migrations'))")
        .catch(() => {});
      migrationLock.release();
    }
    globalDb.__kushoniyonPool = pool;
    return database;
  }

  const dataDir = process.env.PGLITE_DATA_DIR
    ? path.resolve(process.env.PGLITE_DATA_DIR)
    : path.join(process.cwd(), ".data", "kushoniyon");
  await mkdir(dataDir, { recursive: true });
  const client = new PGlite({
    dataDir,
    extensions: { btree_gist, citext, pg_trgm },
  });
  const embedded = drizzlePglite(client, { schema });
  await migratePglite(embedded, { migrationsFolder });
  globalDb.__kushoniyonPglite = client;
  return embedded as unknown as AppDatabase;
}

export function getDb(): Promise<AppDatabase> {
  globalDb.__kushoniyonInit ??= initialize()
    .then((database) => {
      globalDb.__kushoniyonDb = database;
      return database;
    })
    .catch((error) => {
      globalDb.__kushoniyonInit = undefined;
      throw error;
    });
  return globalDb.__kushoniyonInit;
}

export async function closeDb(): Promise<void> {
  const pglite = globalDb.__kushoniyonPglite;
  const pool = globalDb.__kushoniyonPool;
  globalDb.__kushoniyonPglite = undefined;
  globalDb.__kushoniyonPool = undefined;
  globalDb.__kushoniyonDb = undefined;
  globalDb.__kushoniyonInit = undefined;

  if (pglite && !pglite.closed) {
    await pglite.close().catch(() => {});
  }
  if (pool) {
    await pool.end().catch(() => {});
  }
}
