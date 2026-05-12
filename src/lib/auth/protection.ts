import { notFound, redirect } from 'next/navigation'

import type { User } from '@/payload/payload-types'

import { getCurrentPayloadUser } from './current-user'
import { buildLoginRedirectPath } from './redirects'
import { hasRole, type UserRole } from './roles'

export async function requireCurrentUser(requestedPath: string): Promise<User> {
  const user = await getCurrentPayloadUser()

  if (!user) {
    redirect(buildLoginRedirectPath(requestedPath))
  }

  return user
}

export async function requireRole(requestedPath: string, role: UserRole): Promise<User> {
  const user = await requireCurrentUser(requestedPath)

  if (!hasRole(user, role)) {
    notFound()
  }

  return user
}
