import { describe, expect, it } from 'bun:test'

import {
  buildUnansweredAnswers,
  normalizeStudySessionInput,
  type QuestionVersionForStudySession,
  validateStudySessionQuestionRelationship,
} from '@/payload/collections/study-session-utils'

const fixedNow = new Date('2026-05-03T01:02:03.000Z')

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
            question: 12,
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
          question: 12,
          questionVersionId: 'version-12',
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
      validateStudySessionQuestionRelationship(12, {
        questions: [{ question: 12 }, { question: { id: 12 } }],
      }),
    ).toBe('Study sessions cannot contain duplicate questions.')
  })

  it('allows unique question relationships', () => {
    expect(
      validateStudySessionQuestionRelationship(12, {
        questions: [{ question: 12 }, { question: { id: 13 } }],
      }),
    ).toBe(true)
  })

  it('leaves duplicate question relationships for field validation', async () => {
    const normalized = await normalizeStudySessionInput({
      data: {
        questions: [{ question: 12 }, { question: { id: 12 } }],
      },
      lockQuestionVersion: async (questionId) => createQuestionVersion(questionId, ['part-1']),
      operation: 'create',
    })

    expect(normalized.questions?.map((question) => question.question)).toEqual([12, { id: 12 }])
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
              question: 13,
              questionVersionId: 'version-12',
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
              question: 12,
              questionVersionId: 'version-12',
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
            question: 13,
            questionVersionId: 'version-12',
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
            question: 12,
            questionVersionId: 'version-12',
            status: 'notStarted',
            answers: [{ partId: 'old-part', type: 'unanswered' }],
          },
        ],
      },
    })

    expect(normalized.questions?.[0]).toEqual({
      id: 'row-1',
      question: 13,
      questionVersionId: 'version-13',
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
              question: 12,
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
              question: 12,
              questionVersionId: 'version-12',
              status: 'answered',
              answers: [{ partId: 'part-1', type: 'selfReport', selfReport: { answer: true } }],
            },
          ],
        },
      }),
    ).rejects.toThrow('Finished study sessions cannot change their question list or locked versions.')
  })
})

function createQuestionVersion(
  questionId: number,
  partIds: string[],
): QuestionVersionForStudySession {
  return {
    id: `version-${questionId}`,
    version: {
      parts: partIds.map((id) => ({ id })),
    },
  }
}
