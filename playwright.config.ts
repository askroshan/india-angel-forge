import { defineConfig, devices } from "@playwright/test";

const VITE_PORT = process.env.VITE_PORT ?? '8082';
const API_PORT = process.env.API_PORT ?? '3001';
const BASE_URL = process.env.BASE_URL ?? `http://localhost:${VITE_PORT}`;
const API_URL = process.env.API_URL ?? `http://localhost:${API_PORT}`;

/**
 * Playwright E2E Test Configuration for India Angel Forum
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./e2e",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use */
  reporter: [
    ["html", { outputFolder: "playwright-report" }],
    ["list"],
  ],
  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: BASE_URL,
    /* Collect trace when retrying the failed test */
    trace: "on-first-retry",
    /* Screenshot on failure */
    screenshot: "only-on-failure",
    /* Video on failure */
    video: "on-first-retry",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
      testIgnore: ["**/event-attendance.spec.ts"],
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
      testIgnore: ["**/event-attendance.spec.ts"],
    },
    /* Test against mobile viewports */
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
      testIgnore: [
        "**/event-attendance.spec.ts",
        "**/admin-operations.spec.ts",
        "**/compliance-kyc.spec.ts",
      ],
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
      testIgnore: [
        "**/event-attendance.spec.ts",
        "**/admin-operations.spec.ts",
        "**/compliance-kyc.spec.ts",
      ],
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: [
    {
      command: "npm run dev:server",
      url: `${API_URL}/api/health`,
      reuseExistingServer: true,  // Always reuse to avoid startup issues
      timeout: 120 * 1000,
    },
    {
      command: "npm run dev",
      url: BASE_URL,
      reuseExistingServer: true,  // Always reuse to avoid startup issues
      timeout: 120 * 1000,
    },
  ],
});
