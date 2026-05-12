import type { User } from '@/payload/payload-types'

export const USER_ROLES = {
  admin: 'admin',
  student: 'student',
} as const

export const userRoleValues = [USER_ROLES.admin, USER_ROLES.student] as const

export type UserRole = (typeof userRoleValues)[number]

type UserWithRoles = Pick<User, 'roles'> | null | undefined

export function hasRole(user: UserWithRoles, role: UserRole): boolean {
  return user?.roles?.includes(role) ?? false
}

export function hasAnyRole(user: UserWithRoles, roles: readonly UserRole[]): boolean {
  return roles.some((role) => hasRole(user, role))
}
