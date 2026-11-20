import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

// Optional system Chromium, e.g. on Alpine: PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium
const executablePath = process.env["PLAYWRIGHT_CHROMIUM_EXECUTABLE"];

// Runs against a production build: pnpm build && pnpm test:e2e
export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: Boolean(process.env["CI"]),
  retries: 1,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${String(PORT)}`,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(executablePath === undefined || executablePath === ""
          ? {}
          : { launchOptions: { executablePath } }),
      },
    },
  ],
  webServer: {
    command: `pnpm start --port ${String(PORT)}`,
    url: `http://localhost:${String(PORT)}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
