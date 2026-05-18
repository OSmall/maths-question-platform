import { expect, test } from './test'
import type { Page } from '@playwright/test'
import { getPayload } from 'payload'

import { USER_ROLES, type UserRole } from '@/lib/auth/roles'
import type { Question, User } from '@/payload/payload-types'

const adminEmail = 'e2e-admin@example.com'
const studentEmail = 'e2e-student@example.com'
const password = 'Payload-e2e-password-14'

test.beforeAll(async () => {
  const { config: loadEnv } = await import('dotenv')
  loadEnv({ path: '.env.local' })

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

    expect(page.url().startsWith(test.info().project.use.baseURL ?? '')).toBe(true)
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

  test('persists study session flag changes after reload', async ({ page }) => {
    const student = await createUser({ password, roles: [USER_ROLES.student] })
    const { session } = await createStudySessionFixture(student)

    await page.goto('/login')
    await page.getByLabel('Email').fill(student.email)
    await page.getByLabel('Password').fill(password)
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page).toHaveURL('/')

    await page.goto(`/study-session/${session.id}/question/1`)
    await expect(page.getByRole('button', { name: 'Flag' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )

    const flagResponsePromise = waitForStudySessionActionResponse(page, session.id)
    await page.getByRole('button', { name: 'Flag' }).click()
    await expect(page.getByRole('button', { name: 'Flagged' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect((await flagResponsePromise).ok()).toBe(true)

    await page.reload()
    await expect(page.getByRole('button', { name: 'Flagged' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    const unflagResponsePromise = waitForStudySessionActionResponse(page, session.id)
    await page.getByRole('button', { name: 'Flagged' }).click()
    await expect(page.getByRole('button', { name: 'Flag' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect((await unflagResponsePromise).ok()).toBe(true)

    await page.reload()
    await expect(page.getByRole('button', { name: 'Flag' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })
})

function waitForStudySessionActionResponse(page: Page, sessionId: number) {
  return page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      response.url().includes(`/study-session/${sessionId}/question/1`),
  )
}

async function createStudySessionFixture(user: User) {
  const payload = await getPayloadInstance()
  const question = await createPublishedQuestion()
  const session = await payload.create({
    collection: 'studySession',
    data: {
      state: 'started',
      user: user.id,
      questions: [
        {
          question: question.id,
          questionVersionId: 'pending-lock',
          status: 'notStarted',
          flagged: false,
          answers: [{ partId: 'pending-lock', type: 'unanswered' }],
        },
      ],
    },
    depth: 0,
    draft: false,
  })

  return { question, session }
}

async function createUser({ password, roles }: { password: string; roles: UserRole[] }) {
  const payload = await getPayloadInstance()
  const email = `e2e-student-${crypto.randomUUID()}@example.com`

  return payload.create({
    collection: 'users',
    data: {
      email,
      password,
      roles,
    },
    depth: 0,
  }) as Promise<User>
}

async function createPublishedQuestion() {
  const payload = await getPayloadInstance()
  const idSuffix = crypto.randomUUID()

  return payload.create({
    collection: 'question',
    data: {
      prompt: nonEmptyRichText,
      parts: [
        {
          id: `mc-part-${idSuffix}`,
          prompt: nonEmptyRichText,
          response: {
            type: 'multipleChoice',
            multipleChoice: {
              choices: [
                { id: `mc-a-${idSuffix}`, text: '3', isCorrect: false },
                { id: `mc-b-${idSuffix}`, text: '4', isCorrect: true },
              ],
              shuffle: false,
            },
          },
        },
      ],
      _status: 'published',
    },
    depth: 0,
  })
}

async function getPayloadInstance() {
  const { default: config } = await import('@payload-config')

  return getPayload({ config })
}

const nonEmptyRichText = {
  root: {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        version: 1,
        children: [
          {
            type: 'text',
            version: 1,
            text: 'Prompt text',
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
      },
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  },
} satisfies NonNullable<Question['prompt']>
