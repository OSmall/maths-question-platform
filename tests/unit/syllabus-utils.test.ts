import { describe, expect, it, mock } from 'bun:test'

import { validateUniqueSyllabusSubTopic } from '@/payload/collections/syllabus-utils'
import { parseUUID } from '@/lib/domain/uuid'

const syllabusA = parseUUID('018f5f53-5c65-7a29-9b8d-9f8f9b9f9a23')
const syllabusB = parseUUID('018f5f53-5c65-7a29-9b8d-9f8f9b9f9a24')
const syllabusC = parseUUID('018f5f53-5c65-7a29-9b8d-9f8f9b9f9a25')
const subTopicA = parseUUID('018f5f53-5c65-7a29-9b8d-9f8f9b9f9a26')
const subTopicB = parseUUID('018f5f53-5c65-7a29-9b8d-9f8f9b9f9a27')
const subTopicC = parseUUID('018f5f53-5c65-7a29-9b8d-9f8f9b9f9a28')
const mappingA = parseUUID('018f5f53-5c65-7a29-9b8d-9f8f9b9f9a29')

describe('validateUniqueSyllabusSubTopic', () => {
  it('allows a new syllabus/subtopic pair', async () => {
    const find = mock(async () => ({
      docs: [
        {
          id: mappingA,
          subTopic: subTopicA,
          syllabus: syllabusA,
        },
      ],
    }))

    const result = await validateUniqueSyllabusSubTopic({
      req: {
        payload: {
          find,
        },
      },
      subTopic: subTopicB,
      syllabus: syllabusA,
    })

    expect(result).toBe(true)
  })

  it('rejects a duplicate syllabus/subtopic pair', async () => {
    const find = mock(async () => ({
      docs: [
        {
          id: mappingA,
          subTopic: subTopicB,
          syllabus: syllabusB,
        },
      ],
    }))

    const result = await validateUniqueSyllabusSubTopic({
      req: {
        payload: {
          find,
        },
      },
      subTopic: subTopicB,
      syllabus: syllabusB,
    })

    expect(result).toBe('This subtopic is already mapped for the selected syllabus.')
  })

  it('ignores the current row when editing an existing mapping', async () => {
    const find = mock(async () => ({
      docs: [
        {
          id: mappingA,
          subTopic: subTopicC,
          syllabus: syllabusC,
        },
      ],
    }))

    const result = await validateUniqueSyllabusSubTopic({
      id: mappingA,
      req: {
        payload: {
          find,
        },
      },
      subTopic: subTopicC,
      syllabus: syllabusC,
    })

    expect(result).toBe(true)
  })
})
