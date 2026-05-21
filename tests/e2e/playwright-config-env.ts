import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

/**
 * Playwright configuration environment.
 *
 * This module is imported while `playwright.config.ts` is being evaluated,
 * before the Next dev server has started and before tests are running. Keep
 * this schema limited to values needed to configure Playwright itself.
 */
export const playwrightEnv = createEnv({
  server: {
    isCi: z
      .string()
      .optional()
      .transform((value) => value !== undefined && value !== '0' && value.toLowerCase() !== 'false'),
  },
  runtimeEnv: {
    isCi: process.env.CI,
  },
  emptyStringAsUndefined: true,
})
