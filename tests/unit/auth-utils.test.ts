import { describe, expect, it } from 'bun:test'

import { getAuthenticatedRedirectPath, getSafeRelativeRedirectPath } from '@/lib/auth/redirects'
import { hasRole, USER_ROLES } from '@/lib/auth/roles'
import type { User } from '@/payload/payload-types'

describe('auth utilities', () => {
  it('accepts safe relative redirect paths', () => {
    expect(getSafeRelativeRedirectPath('/study-session/123/question/0?review=1#part-2')).toBe(
      '/study-session/123/question/0?review=1#part-2',
    )
  })

  it('rejects unsafe redirect paths', () => {
    expect(getSafeRelativeRedirectPath('https://example.com')).toBeUndefined()
    expect(getSafeRelativeRedirectPath('//example.com')).toBeUndefined()
    expect(getSafeRelativeRedirectPath('/\\example.com')).toBeUndefined()
  })

  it('uses a safe requested redirect first', () => {
    expect(getAuthenticatedRedirectPath('/question/12?previewStudySessionId=abc')).toBe(
      '/question/12?previewStudySessionId=abc',
    )
  })

  it('falls back to home without a safe requested redirect', () => {
    expect(getAuthenticatedRedirectPath()).toBe('/')
    expect(getAuthenticatedRedirectPath('https://example.com')).toBe('/')
  })

  it('checks optional multi-role values', () => {
    expect(hasRole(createUser([USER_ROLES.admin, USER_ROLES.student]), USER_ROLES.admin)).toBe(true)
    expect(hasRole(createUser([USER_ROLES.student]), USER_ROLES.admin)).toBe(false)
    expect(hasRole(createUser([]), USER_ROLES.student)).toBe(false)
  })
})

function createUser(roles: User['roles']): User {
  return {
    id: 1,
    email: 'user@example.com',
    roles,
    createdAt: '2026-05-13T00:00:00.000Z',
    updatedAt: '2026-05-13T00:00:00.000Z',
  } as User
}
