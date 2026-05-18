import { afterEach, describe, expect, it, mock, vi } from 'bun:test'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { ResultAsync } from 'neverthrow'

import {
  StudySessionQuestionAlreadyAnsweredError,
  StudySessionQuestionIncompleteAnswerError,
  StudySessionQuestionIndexError,
} from '@/lib/errors'
import type {
  PayloadLockedQuestionVersionForService,
  PayloadStudySessionForService,
} from '@/lib/repository/study-session-repository'

const fetchStudySessionByIdResult = mock((id: number) =>
  ResultAsync.fromPromise(Promise.resolve(createPayloadStudySession(id)), (error) => error as Error),
)
const fetchLockedQuestionVersionByIdResult = mock((id: string) =>
  ResultAsync.fromPromise(Promise.resolve(createPayloadQuestionVersion(id)), (error) => error as Error),
)
const updateStudySessionResult = mock((studySession: PayloadStudySessionForService) =>
  ResultAsync.fromPromise(Promise.resolve(studySession), (error) => error as Error),
)

mock.module('@/lib/repository/study-session-repository', () => ({
  fetchStudySessionByIdResult,
  fetchLockedQuestionVersionByIdResult,
  updateStudySessionResult,
}))

const {
  getStudySessionQuestionByIndex,
  setStudySessionQuestionFlagged,
  skipStudySessionQuestion,
  submitStudySessionQuestionAnswers,
} = await import('@/lib/service/study-session-service')

describe('study session service', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('loads a locked question version by session id and zero-based question index', async () => {
    const result = await getStudySessionQuestionByIndex(123, 0)

    expect(fetchStudySessionByIdResult).toHaveBeenCalledWith(123)
    expect(fetchLockedQuestionVersionByIdResult).toHaveBeenCalledWith('version-10')
    expect(result.isOk()).toBe(true)

    if (result.isErr()) {
      throw result.error
    }

    expect(result.value.question).toMatchObject({
      id: 10,
      index: 0,
      version: 'version-10',
      shuffleKeyBase: '123:0:10',
    })
    expect(result.value.session.questionCount).toBe(1)
    expect(result.value.questionSubmissionEvaluation).toEqual({
      isEvaluated: false,
      answeredParts: 0,
      parts: {
        'part-1': {
          type: 'multipleChoice',
        },
      },
    })
  })

  it('marks the session finished using the final answer timestamp when all questions are answered', async () => {
    const now = new Date('2026-05-04T10:11:12.000Z')

    const result = await submitStudySessionQuestionAnswers(
      123,
      0,
      [{ partId: 'part-1', type: 'multipleChoice', choiceId: 'choice-a' }],
      { now },
    )

    expect(result.isOk()).toBe(true)
    expect(updateStudySessionResult).toHaveBeenCalledTimes(1)

    const updatedSession = updateStudySessionResult.mock.calls[0]?.[0]
    expect(updatedSession).toMatchObject({
      state: 'finished',
      endedAt: now.toISOString(),
      questions: [
        {
          status: 'answered',
          answeredAt: now.toISOString(),
          skippedAt: undefined,
          answers: [
            {
              partId: 'part-1',
              type: 'multipleChoice',
              multipleChoice: { choiceId: 'choice-a' },
            },
          ],
        },
      ],
    })
  })

  it('keeps the session started and clears stale endedAt on non-final submit', async () => {
    const now = new Date('2026-05-04T10:11:12.000Z')
    fetchStudySessionByIdResult.mockImplementationOnce((id: number) =>
      ResultAsync.fromPromise(
        Promise.resolve({
          ...createPayloadStudySession(id),
          endedAt: '2026-05-01T00:00:00.000Z',
          questions: [
            createPayloadStudySessionQuestion(10),
            createPayloadStudySessionQuestion(11),
          ],
        } satisfies PayloadStudySessionForService),
        (error) => error as Error,
      ),
    )

    const result = await submitStudySessionQuestionAnswers(
      123,
      0,
      [{ partId: 'part-1', type: 'multipleChoice', choiceId: 'choice-a' }],
      { now },
    )

    expect(result.isOk()).toBe(true)

    const updatedSession = updateStudySessionResult.mock.calls[0]?.[0]
    expect(updatedSession?.state).toBe('started')
    expect(updatedSession?.endedAt).toBeUndefined()
  })

  it('persists skipped status and leaves the session started', async () => {
    const now = new Date('2026-05-04T10:11:12.000Z')

    const result = await skipStudySessionQuestion(123, 0, { now })

    expect(result.isOk()).toBe(true)
    const updatedSession = updateStudySessionResult.mock.calls[0]?.[0]
    expect(updatedSession).toMatchObject({
      state: 'started',
      endedAt: undefined,
      questions: [
        {
          status: 'skipped',
          answeredAt: undefined,
          skippedAt: now.toISOString(),
          answers: [{ partId: 'part-1', type: 'unanswered' }],
        },
      ],
    })
  })

  it('sets the absolute flagged state', async () => {
    const result = await setStudySessionQuestionFlagged(123, 0, true)

    expect(result.isOk()).toBe(true)
    const updatedSession = updateStudySessionResult.mock.calls[0]?.[0]
    expect(updatedSession?.questions[0]?.flagged).toBe(true)
  })

  it('returns a business error for an out-of-range question index', async () => {
    const result = await getStudySessionQuestionByIndex(123, 99)

    expect(result.isErr()).toBe(true)
    if (result.isOk()) {
      throw new Error('Expected an error result')
    }
    expect(result.error).toBeInstanceOf(StudySessionQuestionIndexError)
  })

  it('returns a business error when submitting an already answered question', async () => {
    fetchStudySessionByIdResult.mockImplementationOnce((id: number) =>
      ResultAsync.fromPromise(
        Promise.resolve({
          ...createPayloadStudySession(id),
          state: 'finished',
          endedAt: '2026-05-04T10:11:12.000Z',
          questions: [
            {
              ...createPayloadStudySessionQuestion(10),
              status: 'answered',
              answeredAt: '2026-05-04T10:11:12.000Z',
              answers: [
                {
                  partId: 'part-1',
                  type: 'multipleChoice',
                  multipleChoice: { choiceId: 'choice-a' },
                },
              ],
            },
          ],
        } satisfies PayloadStudySessionForService),
        (error) => error as Error,
      ),
    )

    const result = await submitStudySessionQuestionAnswers(123, 0, [
      { partId: 'part-1', type: 'multipleChoice', choiceId: 'choice-a' },
    ])

    expect(result.isErr()).toBe(true)
    if (result.isOk()) {
      throw new Error('Expected an error result')
    }
    expect(result.error).toBeInstanceOf(StudySessionQuestionAlreadyAnsweredError)
  })

  it('returns a business error when required answers are missing', async () => {
    const result = await submitStudySessionQuestionAnswers(123, 0, [])

    expect(result.isErr()).toBe(true)
    if (result.isOk()) {
      throw new Error('Expected an error result')
    }
    expect(result.error).toBeInstanceOf(StudySessionQuestionIncompleteAnswerError)
  })

  it('returns a business error when a short text answer is blank', async () => {
    fetchLockedQuestionVersionByIdResult.mockImplementationOnce((id: string) =>
      ResultAsync.fromPromise(Promise.resolve(createPayloadQuestionVersion(id, 'shortText')), (error) => error as Error),
    )

    const result = await submitStudySessionQuestionAnswers(123, 0, [
      { partId: 'part-1', type: 'shortText', answer: '   ' },
    ])

    expect(result.isErr()).toBe(true)
    if (result.isOk()) {
      throw new Error('Expected an error result')
    }
    expect(result.error).toBeInstanceOf(StudySessionQuestionIncompleteAnswerError)
  })
})

const nonEmptyRichText = {
  root: {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        version: 1,
        children: [
          {
            type: 'text',
            version: 1,
            text: 'Prompt text',
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
      },
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  },
} as unknown as SerializedEditorState

function createPayloadStudySession(id: number): PayloadStudySessionForService {
  return {
    id,
    state: 'started',
    begunAt: '2026-05-04T09:00:00.000Z',
    endedAt: undefined,
    questions: [createPayloadStudySessionQuestion(10)],
  } satisfies PayloadStudySessionForService
}

function createPayloadStudySessionQuestion(questionId: number): PayloadStudySessionForService['questions'][number] {
  return {
    id: `row-${questionId}`,
    question: questionId,
    questionVersionId: `version-${questionId}`,
    status: 'notStarted',
    flagged: false,
    answeredAt: undefined,
    skippedAt: undefined,
    answers: [{ partId: 'part-1', type: 'unanswered' }],
  }
}

function createPayloadQuestionVersion(
  id: string,
  responseType: 'multipleChoice' | 'shortText' = 'multipleChoice',
): PayloadLockedQuestionVersionForService {
  const questionId = Number(id.replace('version-', ''))

  return {
    id,
    parent: questionId,
    latest: true,
    createdAt: '2026-05-04T09:00:00.000Z',
    updatedAt: '2026-05-04T09:00:00.000Z',
    version: {
      id: questionId,
      prompt: nonEmptyRichText,
      subTopics: [],
      parts: [
        {
          id: 'part-1',
          prompt: undefined,
          response:
            responseType === 'shortText'
              ? {
                  type: 'shortText',
                  shortText: {
                    acceptedAnswers: [{ id: 'accepted-1', value: '42' }],
                  },
                }
              : {
                  type: 'multipleChoice',
                  multipleChoice: {
                    choices: [
                      { id: 'choice-a', text: 'Option A', isCorrect: true },
                      { id: 'choice-b', text: 'Option B', isCorrect: false },
                    ],
                    shuffle: true,
                  },
                },
          workedSolutions: [],
        },
      ],
      createdAt: '2026-05-04T09:00:00.000Z',
      updatedAt: '2026-05-04T09:00:00.000Z',
      _status: 'published',
    },
  } as unknown as PayloadLockedQuestionVersionForService
}
