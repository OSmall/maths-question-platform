import type { Access, PayloadRequest } from 'payload'

import { hasRole, USER_ROLES } from '@/lib/auth/roles'
import type { User } from '@/payload/payload-types'

type RequestWithUser = Pick<PayloadRequest, 'user'>

export const authenticated: Access = ({ req }) => Boolean(req.user)

export const adminOnly = ({ req }: { req: PayloadRequest }) => isAdminRequest(req)

export const ownerOrAdmin: Access = ({ req }) => {
  if (!req.user) {
    return false
  }

  if (isAdminRequest(req)) {
    return true
  }

  return {
    user: {
      equals: req.user.id,
    },
  }
}

export function isAdminRequest(req: RequestWithUser): boolean {
  return hasRole(req.user as User | null | undefined, USER_ROLES.admin)
}
