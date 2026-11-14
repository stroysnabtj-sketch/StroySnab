import { getDb, closeDb } from "../src/db";
import { users, sessions } from "../src/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes, createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { seedDatabase } from "./seed";
(async () => {
  if (process.env.DATABASE_URL || !process.env.PGLITE_DATA_DIR?.includes("acceptance"))
    throw Error("Acceptance seed requires isolated local database");
  const db = await getDb();
  await seedDatabase(db);
  const [customer] = await db.select().from(users).where(eq(users.role, "CUSTOMER")).limit(1);
  const token = randomBytes(32).toString("base64url");
  await db
    .insert(sessions)
    .values({
      userId: customer.id,
      tokenHash: createHash("sha256").update(token).digest("hex"),
      expiresAt: new Date(Date.now() + 3600000),
    });
  writeFileSync(".data/acceptance-session.json", JSON.stringify({ token }));
  await closeDb();
})().catch(() => {
  console.error("Acceptance seed failed");
  process.exitCode = 1;
});
