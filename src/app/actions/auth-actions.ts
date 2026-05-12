'use server'

import { login, logout } from '@payloadcms/next/auth'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { getAuthenticatedRedirectPath, getSafeRelativeRedirectPath } from '@/lib/auth/redirects'
import { actionClient } from '@/lib/safe-action'
import config from '@payload-config'

const loginFormSchema = z
  .instanceof(FormData)
  .transform((formData) => ({
    email: String(formData.get('email') ?? '').trim(),
    password: String(formData.get('password') ?? ''),
    redirect: String(formData.get('redirect') ?? ''),
  }))
  .pipe(
    z.object({
      email: z.string(),
      password: z.string(),
      redirect: z.string(),
    }),
  )

export const loginAction = actionClient.inputSchema(loginFormSchema).action(async ({ parsedInput }) => {
  const safeRedirect = getSafeRelativeRedirectPath(parsedInput.redirect)

  let destination: string

  try {
    await login({
      collection: 'users',
      config,
      email: parsedInput.email,
      password: parsedInput.password,
    })

    destination = getAuthenticatedRedirectPath(safeRedirect)
  } catch {
    const searchParams = new URLSearchParams({ error: 'invalid' })

    if (safeRedirect) {
      searchParams.set('redirect', safeRedirect)
    }

    redirect(`/login?${searchParams.toString()}`)
  }

  redirect(destination)
})

export async function loginFormAction(formData: FormData): Promise<void> {
  await loginAction(formData)
}

export const logoutAction = actionClient.action(async () => {
  await logout({ config })
  redirect('/login')
})

export async function logoutFormAction(): Promise<void> {
  await logoutAction()
}
