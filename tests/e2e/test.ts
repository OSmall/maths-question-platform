import { expect, test as base } from '@playwright/test'

base.use({
  baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
})

export { expect, base as test }
