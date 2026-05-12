import { redirect } from 'next/navigation'

import { loginFormAction } from '@/app/actions/auth-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getCurrentPayloadUser } from '@/lib/auth/current-user'
import { getAuthenticatedRedirectPath, getSafeRelativeRedirectPath } from '@/lib/auth/redirects'

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const metadata = {
  title: 'Login | Maths Question Platform',
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams
  const redirectParam = getSingleSearchParam(resolvedSearchParams.redirect)
  const safeRedirect = getSafeRelativeRedirectPath(redirectParam)
  const user = await getCurrentPayloadUser()

  if (user) {
    redirect(getAuthenticatedRedirectPath(safeRedirect))
  }

  const hasInvalidLogin = getSingleSearchParam(resolvedSearchParams.error) === 'invalid'

  return (
    <div className="flex min-h-[calc(100vh-65px)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Sign in to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={loginFormAction} className="flex flex-col gap-5">
            {safeRedirect && <input type="hidden" name="redirect" value={safeRedirect} />}
            {hasInvalidLogin && (
              <div className="rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                We could not sign you in with those details. Check your email and password.
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            <Button type="submit" size="lg" className="w-full cursor-pointer">
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function getSingleSearchParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}
