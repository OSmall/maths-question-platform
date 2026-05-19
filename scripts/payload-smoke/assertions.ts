import type { ExpectedPayloadIdType, SmokeContext, SmokeId } from './types'

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function assertPayloadId(id: unknown, label: string, expectedType: ExpectedPayloadIdType) {
  if (expectedType === 'number') {
    if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
      throw new Error(`${label} expected a positive numeric Payload ID, received ${formatValue(id)}.`)
    }
    return
  }

  if (typeof id !== 'string' || !uuidPattern.test(id)) {
    throw new Error(`${label} expected a UUID Payload ID, received ${formatValue(id)}.`)
  }
}

export function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(`${label} expected ${formatValue(expected)}, received ${formatValue(actual)}.`)
  }
}

export function assertRecord<T>(record: T | undefined, label: string): T {
  if (!record) {
    throw new Error(`${label} was not created before verification.`)
  }

  return record
}

export async function assertRelationshipResolves(
  context: SmokeContext,
  options: {
    collection: 'studySession' | 'subTopic' | 'syllabusSubTopic'
    id: SmokeId
    label: string
    predicate: (document: unknown) => boolean
  },
) {
  const document = await context.payload.findByID({
    collection: options.collection,
    depth: 1,
    id: options.id,
  })

  if (!options.predicate(document)) {
    throw new Error(`${options.label} did not resolve its depth: 1 relationship shape.`)
  }
}

function formatValue(value: unknown) {
  return typeof value === 'string' ? JSON.stringify(value) : String(value)
}
