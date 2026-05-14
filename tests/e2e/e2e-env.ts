import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

/**
 * E2E test runtime environment.
 *
 * This module is imported by Playwright tests and fixtures after Playwright has
 * started the web server. Keep this separate from `src/env.ts` so test runtime
 * code only validates values owned by the Playwright test process.
 */
export const e2eEnv = createEnv({
  server: {
    PLAYWRIGHT_BASE_URL: z.url(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
})
