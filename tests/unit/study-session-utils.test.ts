import { describe, expect, it } from 'bun:test'

import {
  buildUnansweredAnswers,
  normalizeStudySessionInput,
  type QuestionVersionForStudySession,
  validateStudySessionQuestionRelationship,
} from '@/payload/collections/study-session-utils'
import { parseUUID } from '@/lib/domain/uuid'

const fixedNow = new Date('2026-05-03T01:02:03.000Z')
const questionA = parseUUID('018f5f53-5c65-7a29-9b8d-9f8f9b9f9a18')
const questionB = parseUUID('018f5f53-5c65-7a29-9b8d-9f8f9b9f9a19')

describe('study session utils', () => {
  it('builds explicit unanswered rows for every question part', () => {
    expect(buildUnansweredAnswers(['part-1', 'part-2'])).toEqual([
      { partId: 'part-1', type: 'unanswered' },
      { partId: 'part-2', type: 'unanswered' },
    ])
  })

  it('forces new sessions to started and locks question versions with unanswered answers', async () => {
    const normalized = await normalizeStudySessionInput({
      data: {
        state: 'notStarted',
        questions: [
          {
            question: questionA,
          },
        ],
      },
      lockQuestionVersion: async (questionId) => createQuestionVersion(questionId, ['part-1']),
      now: fixedNow,
      operation: 'create',
    })

    expect(normalized).toEqual({
      state: 'started',
      begunAt: fixedNow.toISOString(),
      endedAt: undefined,
      questions: [
        {
          question: questionA,
          questionVersionId: `version-${questionA}`,
          status: 'notStarted',
          flagged: false,
          answeredAt: undefined,
          skippedAt: undefined,
          answers: [{ partId: 'part-1', type: 'unanswered' }],
        },
      ],
    })
  })

  it('validates missing question relationships', () => {
    expect(validateStudySessionQuestionRelationship(undefined, { questions: [{}] })).toBe(
      'Choose a question.',
    )
  })

  it('validates duplicate question relationships', () => {
    expect(
      validateStudySessionQuestionRelationship(questionA, {
        questions: [{ question: questionA }, { question: { id: questionA } }],
      }),
    ).toBe('Study sessions cannot contain duplicate questions.')
  })

  it('allows unique question relationships', () => {
    expect(
      validateStudySessionQuestionRelationship(questionA, {
        questions: [{ question: questionA }, { question: { id: questionB } }],
      }),
    ).toBe(true)
  })

  it('leaves duplicate question relationships for field validation', async () => {
    const normalized = await normalizeStudySessionInput({
      data: {
        questions: [{ question: questionA }, { question: { id: questionA } }],
      },
      lockQuestionVersion: async (questionId) => createQuestionVersion(questionId, ['part-1']),
      operation: 'create',
    })

    expect(normalized.questions?.map((question) => question.question)).toEqual([questionA, { id: questionA }])
  })

  it('leaves missing question relationships for field validation', async () => {
    let lockCalls = 0

    const normalized = await normalizeStudySessionInput({
      data: {
        questions: [{}],
      },
      lockQuestionVersion: async (questionId) => {
        lockCalls += 1
        return createQuestionVersion(questionId, ['part-1'])
      },
      now: fixedNow,
      operation: 'create',
    })

    expect(lockCalls).toBe(0)
    expect(normalized.questions).toEqual([
      {
        flagged: false,
        status: 'notStarted',
      },
    ])
  })

  it('rejects changing the question or version for answered rows', async () => {
    await expect(
      normalizeStudySessionInput({
        data: {
          questions: [
            {
              id: 'row-1',
              question: questionB,
              questionVersionId: `version-${questionA}`,
              status: 'answered',
              answers: [{ partId: 'part-1', type: 'selfReport', selfReport: { answer: true } }],
            },
          ],
        },
        lockQuestionVersion: async (questionId) => createQuestionVersion(questionId, ['part-1']),
        operation: 'update',
        originalDoc: {
          state: 'started',
          questions: [
            {
              id: 'row-1',
              question: questionA,
              questionVersionId: `version-${questionA}`,
              status: 'answered',
              answers: [{ partId: 'part-1', type: 'selfReport', selfReport: { answer: true } }],
            },
          ],
        },
      }),
    ).rejects.toThrow('Answered study session questions cannot change question or version.')
  })

  it('relocks unanswered rows when the question changes', async () => {
    const normalized = await normalizeStudySessionInput({
      data: {
        questions: [
          {
            id: 'row-1',
            question: questionB,
            questionVersionId: `version-${questionA}`,
            status: 'notStarted',
            answers: [{ partId: 'old-part', type: 'unanswered' }],
          },
        ],
      },
      lockQuestionVersion: async (questionId) => createQuestionVersion(questionId, ['new-part']),
      operation: 'update',
      originalDoc: {
        state: 'started',
        questions: [
          {
            id: 'row-1',
              question: questionA,
            questionVersionId: 'version-12',
            status: 'notStarted',
            answers: [{ partId: 'old-part', type: 'unanswered' }],
          },
        ],
      },
    })

    expect(normalized.questions?.[0]).toEqual({
      id: 'row-1',
      question: questionB,
      questionVersionId: `version-${questionB}`,
      status: 'notStarted',
      flagged: false,
      answeredAt: undefined,
      skippedAt: undefined,
      answers: [{ partId: 'new-part', type: 'unanswered' }],
    })
  })

  it('rejects question structure changes for finished sessions', async () => {
    await expect(
      normalizeStudySessionInput({
        data: {
          questions: [
            {
              id: 'row-1',
              question: questionA,
              questionVersionId: 'other-version',
              status: 'answered',
              answers: [{ partId: 'part-1', type: 'selfReport', selfReport: { answer: true } }],
            },
          ],
        },
        lockQuestionVersion: async (questionId) => createQuestionVersion(questionId, ['part-1']),
        operation: 'update',
        originalDoc: {
          state: 'finished',
          questions: [
            {
              id: 'row-1',
              question: questionA,
              questionVersionId: `version-${questionA}`,
              status: 'answered',
              answers: [{ partId: 'part-1', type: 'selfReport', selfReport: { answer: true } }],
            },
          ],
        },
      }),
    ).rejects.toThrow('Finished study sessions cannot change their question list or locked versions.')
  })
})

function createQuestionVersion(questionId: string, partIds: string[]): QuestionVersionForStudySession {
  return {
    id: `version-${questionId}`,
    version: {
      parts: partIds.map((id) => ({ id })),
    },
  }
}
