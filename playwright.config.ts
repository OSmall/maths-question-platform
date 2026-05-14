import { defineConfig, devices } from '@playwright/test'

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import 'dotenv/config'

import { playwrightEnv } from './tests/e2e/playwright-config-env'

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: playwrightEnv.isCi,
  /* Retry on CI only */
  retries: playwrightEnv.isCi ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: playwrightEnv.isCi ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chromium' },
    },
  ],
  webServer: {
    command: 'bun --bun run dev',
    reuseExistingServer: false,
    timeout: 60_000,
    wait: {
      stdout: /Local:\s+(?<playwright_base_url>https?:\/\/(?:localhost|127\.0\.0\.1):\d+)/,
    },
  },
})
