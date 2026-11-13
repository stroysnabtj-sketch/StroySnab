import { closeDb } from "../src/db";
import { processQuotationJob } from "../src/modules/procurement/ai-jobs";
let stopping = false;
process.once("SIGTERM", () => {
  stopping = true;
});
process.once("SIGINT", () => {
  stopping = true;
});
async function main() {
  console.log("Quotation worker ready");
  while (!stopping) {
    const processed = await processQuotationJob();
    if (processed) console.log("Quotation preparation completed");
    if (!processed && !stopping) await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}
main()
  .catch(() => {
    console.error("Quotation worker failed");
    process.exitCode = 1;
  })
  .finally(closeDb);
