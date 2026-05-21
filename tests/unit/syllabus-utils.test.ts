import { describe, expect, it, mock } from 'bun:test'

import { validateUniqueSyllabusSubTopic } from '@/payload/collections/syllabus-utils'

describe('validateUniqueSyllabusSubTopic', () => {
  it('allows a new syllabus/subtopic pair', async () => {
    const find = mock(async () => ({
      docs: [
        {
          id: 1,
          subTopic: 10,
          syllabus: 1,
        },
      ],
    }))

    const result = await validateUniqueSyllabusSubTopic({
      req: {
        payload: {
          find,
        },
      },
      subTopic: 11,
      syllabus: 1,
    })

    expect(result).toBe(true)
  })

  it('rejects a duplicate syllabus/subtopic pair', async () => {
    const find = mock(async () => ({
      docs: [
        {
          id: 7,
          subTopic: 11,
          syllabus: 2,
        },
      ],
    }))

    const result = await validateUniqueSyllabusSubTopic({
      req: {
        payload: {
          find,
        },
      },
      subTopic: 11,
      syllabus: 2,
    })

    expect(result).toBe('This subtopic is already mapped for the selected syllabus.')
  })

  it('ignores the current row when editing an existing mapping', async () => {
    const find = mock(async () => ({
      docs: [
        {
          id: 9,
          subTopic: 20,
          syllabus: 3,
        },
      ],
    }))

    const result = await validateUniqueSyllabusSubTopic({
      id: 9,
      req: {
        payload: {
          find,
        },
      },
      subTopic: 20,
      syllabus: 3,
    })

    expect(result).toBe(true)
  })
})
