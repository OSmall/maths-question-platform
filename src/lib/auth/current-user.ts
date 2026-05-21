import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'

import type { User } from '@/payload/payload-types'
import config from '@payload-config'

export async function getCurrentPayloadUser(): Promise<User | null> {
  const [headers, payload] = await Promise.all([getHeaders(), getPayload({ config })])
  const { user } = await payload.auth({ headers })

  return (user as User | null) ?? null
}
