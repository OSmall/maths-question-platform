import { assertEqual, assertPayloadId, assertRecord } from '../assertions'
import type { SmokeFixture } from '../types'

export const mediaFixture: SmokeFixture = {
  name: 'media',
  async create(context) {
    const now = new Date().toISOString()

    context.records.media = await context.payload.db.create({
      collection: 'media',
      data: {
        alt: `Smoke media ${context.marker}`,
        createdAt: now,
        filename: `${context.marker}.txt`,
        filesize: 0,
        mimeType: 'text/plain',
        updatedAt: now,
      },
    })
  },
  async verify(context) {
    const media = assertRecord(context.records.media, 'Media')
    assertPayloadId(media.id, 'Media ID', context.expectedPayloadIdType)

    const loaded = await context.payload.findByID({ collection: 'media', depth: 0, id: media.id })
    assertEqual(loaded.alt, media.alt, 'Media alt text')
  },
}
