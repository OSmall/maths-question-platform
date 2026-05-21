import type { CollectionBeforeValidateHook, CollectionConfig, PayloadRequest } from 'payload'

import { adminOnly, isAdminRequest } from '@/payload/access'
import { USER_ROLES, userRoleValues } from '@/lib/auth/roles'

const assignFirstUserAdminRole: CollectionBeforeValidateHook = async ({ data, operation, req }) => {
  if (operation !== 'create') {
    return data
  }

  const isFirstUser = await hasNoExistingUsers(req)
  if (!isFirstUser) {
    return data
  }

  const roles = Array.isArray(data?.roles) ? data.roles : []

  return {
    ...data,
    roles: Array.from(new Set([...roles, USER_ROLES.admin])),
  }
}

async function hasNoExistingUsers(req: PayloadRequest) {
  const existingUsers = await req.payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    pagination: false,
  })

  return existingUsers.docs.length === 0
}

async function adminOrFirstUser({ req }: { req: PayloadRequest }) {
  return isAdminRequest(req) || hasNoExistingUsers(req)
}

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: adminOnly,
    create: adminOrFirstUser,
    delete: adminOnly,
    read: adminOnly,
    update: adminOnly,
  },
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  hooks: {
    beforeValidate: [assignFirstUserAdminRole],
  },
  fields: [
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      saveToJWT: true,
      options: userRoleValues.map((role) => ({ label: role, value: role })),
      access: {
        update: ({ req }) => isAdminRequest(req),
      },
      admin: {
        description: 'Optional frontend/admin roles. Users may have zero, one, or multiple roles.',
      },
    },
  ],
}
