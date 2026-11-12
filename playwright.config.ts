import { defineConfig } from "@playwright/test";

const WEB = `http://localhost:${process.env.WEB_PORT ?? 5173}`;

export default defineConfig({
  testDir: "e2e",
  timeout: 30_000,
  reporter: [["list"], ["html", { open: "never", outputFolder: "artifacts/playwright-report" }]],
  use: {
    baseURL: WEB,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    // Set PW_CHANNEL=chrome to use an installed Chrome instead of Playwright's bundled Chromium.
    ...(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {}),
  },
  outputDir: "artifacts/test-results",
  // Reuse the app if the run-app skill already started it; otherwise boot it.
  webServer: {
    command: "npm run dev",
    url: `${WEB}/api/health`,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
