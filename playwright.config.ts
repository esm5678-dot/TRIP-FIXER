import { defineConfig } from "@playwright/test";
const baseURL = process.env.TRIP_FIXER_TEST_URL || "http://127.0.0.1:3200";
export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  use: {
    baseURL,
    viewport: { width: 1280, height: 960 },
    headless: true,
    launchOptions: {
      executablePath:
        process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
      args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
    },
  },
  webServer: process.env.TRIP_FIXER_TEST_URL
    ? undefined
    : {
        command: "npm run start -- --hostname 127.0.0.1 --port 3200",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 45000,
      },
});
