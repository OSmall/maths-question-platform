import { USER_ROLES } from '@/lib/auth/roles'

import { assertEqual, assertPayloadId, assertRecord } from '../assertions'
import type { SmokeFixture } from '../types'

export const usersFixture: SmokeFixture = {
  name: 'users',
  async create(context) {
    context.records.user = await context.payload.create({
      collection: 'users',
      data: {
        email: `${context.marker}@example.com`,
        password: `Smoke-test-password-${context.marker}`,
        roles: [USER_ROLES.admin, USER_ROLES.student],
      },
      depth: 0,
    })
  },
  async verify(context) {
    const user = assertRecord(context.records.user, 'User')
    assertPayloadId(user.id, 'User ID', context.expectedPayloadIdType)

    const loaded = await context.payload.findByID({ collection: 'users', depth: 0, id: user.id })
    assertEqual(loaded.email, user.email, 'User email')
  },
}
