import { expect, test as base } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL

if (!baseURL) {
  throw new Error('PLAYWRIGHT_BASE_URL was not captured from the Playwright webServer output.')
}

base.use({
  baseURL,
})

export { expect, base as test }
