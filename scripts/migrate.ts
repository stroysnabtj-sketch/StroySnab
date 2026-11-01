import { closeDb, getDb } from "../src/db";

async function main() {
  await getDb();
  console.log("Migrations applied");
  await closeDb();
}
void main();
