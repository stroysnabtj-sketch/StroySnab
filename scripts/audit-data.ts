import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { getDb, closeDb } from "../src/db";
import * as schema from "../src/db/schema";
import { auditData } from "../src/modules/system/data-audit";
async function main() {
  const pool = process.env.DATABASE_URL
    ? new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 1,
        connectionTimeoutMillis: 15000,
      })
    : null;
  try {
    const report = await auditData(pool ? drizzle(pool, { schema }) : await getDb());
    console.log(JSON.stringify(report, null, 2));
    if (!report.ok) process.exitCode = 1;
  } finally {
    if (pool) await pool.end();
    else await closeDb();
  }
}
main().catch(() => {
  console.error(
    "Data audit failed. Check schema availability and database access; no records were changed.",
  );
  process.exitCode = 2;
});
