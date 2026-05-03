import { expect, test } from './test'

test.describe('Frontend', () => {
  test('can go on homepage', async ({ page }) => {
    await page.goto('/')

    expect(page.url().startsWith(process.env.PLAYWRIGHT_BASE_URL ?? '')).toBe(true)
    await expect(page).toHaveTitle(/Payload Blank Template/)

    const heading = page.locator('h1').first()

    await expect(heading).toHaveText('Welcome to your new project.')
  })
})
