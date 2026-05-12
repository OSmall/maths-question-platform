import { expect, test } from './test'
import { getPayload } from 'payload'

import { USER_ROLES, type UserRole } from '@/lib/auth/roles'

const adminEmail = 'e2e-admin@example.com'
const studentEmail = 'e2e-student@example.com'
const password = 'Payload-e2e-password-14'

test.beforeAll(async () => {
  const { config: loadEnv } = await import('dotenv')
  loadEnv({ path: '.env.local' })
  process.env.PAYLOAD_SECRET ||= 'e2e-secret-for-payload-local-api'

  const { default: config } = await import('@payload-config')
  const payload = await getPayload({ config })

  await Promise.all([
    ensureUser({ email: adminEmail, password, roles: [USER_ROLES.admin] }),
    ensureUser({ email: studentEmail, password, roles: [USER_ROLES.student] }),
  ])

  async function ensureUser({
    email,
    password,
    roles,
  }: {
    email: string
    password: string
    roles: UserRole[]
  }) {
    const existingUser = await payload.find({
      collection: 'users',
      depth: 0,
      limit: 1,
      where: {
        email: {
          equals: email,
        },
      },
    })

    const data = { email, password, roles }

    if (existingUser.docs[0]) {
      await payload.update({ collection: 'users', id: existingUser.docs[0].id, data })
      return
    }

    await payload.create({ collection: 'users', data })
  }
})

test.describe('Frontend', () => {
  test('can go on homepage', async ({ page }) => {
    await page.goto('/')

    expect(page.url().startsWith(process.env.PLAYWRIGHT_BASE_URL ?? '')).toBe(true)
    await expect(page).toHaveTitle(/Payload Blank Template/)

    const heading = page.locator('h1').first()

    await expect(heading).toHaveText('Welcome to your new project.')
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Admin' })).toBeHidden()
  })

  test('shows failed login feedback', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel('Email').fill(studentEmail)
    await page.getByLabel('Password').fill('not-the-password')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page).toHaveURL(/\/login\?error=invalid/)
    await expect(page.getByText('We could not sign you in with those details.')).toBeVisible()
  })

  test('logs in a student and logs out', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel('Email').fill(studentEmail)
    await page.getByLabel('Password').fill(password)
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: `Welcome back, ${studentEmail}` })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Admin' })).toBeHidden()
    await page.getByRole('button', { name: 'Logout' }).click()

    await expect(page).toHaveURL('/login')
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
  })

  test('redirects protected routes through login and honors the destination', async ({ page }) => {
    await page.goto('/question/1')

    await expect(page).toHaveURL(/\/login\?redirect=%2Fquestion%2F1/)
    await page.getByLabel('Email').fill(adminEmail)
    await page.getByLabel('Password').fill(password)
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page).toHaveURL(/\/question\/1(?:\?|$)/)
  })

  test('returns not found for authenticated users without the admin role', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill(studentEmail)
    await page.getByLabel('Password').fill(password)
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page).toHaveURL('/')

    await page.goto('/question/1')

    await expect(page.getByRole('heading', { name: 'Question Not Found' })).toBeVisible()
  })
})
