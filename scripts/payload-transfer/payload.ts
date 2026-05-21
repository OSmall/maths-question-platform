import { getPayload, type Payload } from 'payload'

import config from '@payload-config'
import type { TransferCollection } from './types'

export async function getPayloadInstance() {
  return getPayload({ config })
}

export async function findAll<T>(payload: Payload, collection: TransferCollection): Promise<T[]> {
  const docs: T[] = []
  let page = 1

  while (true) {
    const result = await payload.find({
      collection,
      depth: 0,
      limit: 100,
      page,
      showHiddenFields: true,
    })

    docs.push(...(result.docs as T[]))

    if (!result.hasNextPage) {
      return docs
    }

    page += 1
  }
}

export async function assertTargetCollectionsEmpty(payload: Payload) {
  const collections: TransferCollection[] = [
    'users',
    'media',
    'topic',
    'subTopic',
    'syllabus',
    'syllabusSubTopic',
    'question',
  ]

  for (const collection of collections) {
    const result = await payload.find({ collection, depth: 0, limit: 1 })

    if (result.docs.length > 0) {
      throw new Error(
        `Target collection ${collection} is not empty. Use a fresh UUID target branch before importing.`,
      )
    }
  }
}
