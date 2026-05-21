import { describe, expect, it } from 'bun:test'
import { getPayload } from 'payload'

import config from '@payload-config'

describe('Payload integration environment', () => {
  it(
    'boots Payload against PGlite and can write through the Local API',
    async () => {
      const payload = await getPayload({ config })
      const name = `Integration Topic ${crypto.randomUUID()}`

      const topic = await payload.create({
        collection: 'topic',
        data: {
          name,
        },
      })

      const result = await payload.find({
        collection: 'topic',
        depth: 0,
        limit: 1,
        where: {
          name: {
            equals: name,
          },
        },
      })

      expect(topic.name).toBe(name)
      expect(result.docs).toHaveLength(1)
      expect(result.docs[0]?.id).toBe(topic.id)
    },
    60_000,
  )
})
