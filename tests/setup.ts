import path from "node:path";
import { beforeAll, afterAll } from "vitest";
import { getDb, closeDb } from "@/db";
import { seedDatabase } from "../scripts/seed";

if (!process.env.DATABASE_URL && !process.env.PGLITE_DATA_DIR) {
  process.env.PGLITE_DATA_DIR = path.resolve(process.cwd(), ".data", "test-kushoniyon");
}

beforeAll(async () => {
  const db = await getDb();
  await seedDatabase(db);
}, 60000);

afterAll(async () => {
  await closeDb();
});

