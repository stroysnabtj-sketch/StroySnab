import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb, closeDb, type AppDatabase } from "../src/db";
import { customers, docCounters, settings, userRoles, users } from "../src/db/schema";
import { seedCatalog } from "./seed-catalog";

export async function ensureUser(
  db: AppDatabase,
  input: { phone: string; email: string; password: string; role: string; fullName?: string },
) {
  const [existing] = await db.select().from(users).where(eq(users.phone, input.phone)).limit(1);
  if (existing) return existing;
  const [user] = await db
    .insert(users)
    .values({
      phone: input.phone,
      email: input.email,
      role: input.role,
      passwordHash: await bcrypt.hash(input.password, 12),
      termsAcceptedAt: input.role === "CUSTOMER" ? new Date() : null,
      termsVersion: input.role === "CUSTOMER" ? "2026-10-30" : null,
    })
    .returning();
  await db.insert(userRoles).values({ userId: user.id, role: input.role }).onConflictDoNothing();
  if (input.role === "CUSTOMER") {
    await db
      .insert(customers)
      .values({ userId: user.id, fullName: input.fullName ?? "Покупатель" })
      .onConflictDoNothing();
  }
  return user;
}

export async function seedDatabase(db: AppDatabase) {
  await db
    .insert(settings)
    .values([
      { key: "delivery.buffer_minutes", value: 30 },
      { key: "terms.current_version", value: "2026-10-30" },
    ])
    .onConflictDoNothing();
  await db
    .insert(docCounters)
    .values([{ kind: "ORD" }, { kind: "SUB" }, { kind: "PRQ" }, { kind: "DRQ" }, { kind: "INV" }])
    .onConflictDoNothing();
  await ensureUser(db, {
    phone: "+992900000001",
    email: "admin@stroyhub.tj",
    password: "Admin123!",
    role: "SUPER_ADMIN",
  });
  await ensureUser(db, {
    phone: "+992900000002",
    email: "sales@stroyhub.tj",
    password: "Sales123!",
    role: "SALES_MANAGER",
  });
  await ensureUser(db, {
    phone: "+992900000003",
    email: "content@stroyhub.tj",
    password: "Content123!",
    role: "CONTENT_MANAGER",
  });
  await ensureUser(db, {
    phone: "+992900000004",
    email: "logistics@stroyhub.tj",
    password: "Logistics123!",
    role: "LOGISTICS",
  });
  await ensureUser(db, {
    phone: "+992921234567",
    email: "client@example.com",
    password: "Client123!",
    role: "CUSTOMER",
    fullName: "Рустам Каримов",
  });
  const supplierUsers = await Promise.all([
    ensureUser(db, {
      phone: "+992900000011",
      email: "seller@stroyhub.tj",
      password: "Seller123!",
      role: "SUPPLIER_OWNER",
    }),
    ensureUser(db, {
      phone: "+992900000012",
      email: "seller2@stroyhub.tj",
      password: "Seller123!",
      role: "SUPPLIER_STAFF",
    }),
    ensureUser(db, {
      phone: "+992900000013",
      email: "seller3@stroyhub.tj",
      password: "Seller123!",
      role: "SUPPLIER_STAFF",
    }),
  ]);
  await seedCatalog(
    db,
    supplierUsers.map((user) => user.id),
  );
}

async function main() {
  const db = await getDb();
  await seedDatabase(db);
  console.log("Foundation, demo users and catalog seeded");
  await closeDb();
}

if (process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("scripts/seed.ts")) {
  void main();
}
