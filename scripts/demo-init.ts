import { closeDb, getDb } from "../src/db";
import { seedDatabase } from "./seed";
import { assertDemoEnvironment } from "./demo-guard.mjs";

async function main() {
  assertDemoEnvironment();
  try {
    // getDb applies the repository's Drizzle migrations before returning.
    const db = await getDb();
    await seedDatabase(db);
    console.log("Local demo migrations and seed complete; password login: /auth/password");
  } finally {
    await closeDb();
  }
}
main().catch((error) => {
  console.error(
    "Demo initialization failed:",
    error instanceof Error ? error.message : "unknown error",
  );
  process.exitCode = 1;
});
