import { expect, test as base } from '@playwright/test'

import { e2eEnv } from './e2e-env'

base.use({
  baseURL: e2eEnv.PLAYWRIGHT_BASE_URL,
})

export { expect, base as test }
