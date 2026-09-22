import { defineConfig, devices } from "@playwright/test";

const port = 5174;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 4,
  reporter: process.env.CI ? [["line"]] : "line",
  outputDir: "test-results",
  use: {
    baseURL,
    colorScheme: "dark",
    screenshot: "only-on-failure",
    trace: process.env.CI ? "on-first-retry" : "retain-on-failure",
    video: process.env.CI ? "on-first-retry" : "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `pnpm --filter @nyx-raul/docs dev --host 127.0.0.1 --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
