import { defineConfig } from "vitest/config";
import base from "../vitest.config.ts";
export default defineConfig({
  ...base,
  oxc: { jsx: { runtime: "automatic" } },
  test: { ...base.test, include: ["tests/integration/delivery-dispatch-map.check.ts"] },
});
