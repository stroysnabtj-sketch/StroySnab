import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/acceptance",
  timeout: 60000,
  expect: { timeout: 15000, toHaveScreenshot: { maxDiffPixelRatio: 0.02 } },
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: "http://localhost:24130",
    browserName: "chromium",
    reducedMotion: "reduce",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "node scripts/acceptance-server.mjs",
    url: "http://localhost:24130/api/health",
    timeout: 120000,
    reuseExistingServer: false,
  },
  reporter: [["list"], ["html", { outputFolder: ".data/acceptance-report", open: "never" }]],
  outputDir: ".data/acceptance-results",
});
