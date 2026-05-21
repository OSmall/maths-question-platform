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
import { parseUUID, randomUUIDv7 } from '@/lib/domain/uuid'

const studySessionId = randomUUIDv7()
const questionA = parseUUID('018f5f53-5c65-7a29-9b8d-9f8f9b9f9a21')
const questionB = parseUUID('018f5f53-5c65-7a29-9b8d-9f8f9b9f9a22')
const questionAVersionId = `version-${questionA}`

const fetchStudySessionByIdResult = mock((id: string) =>
  ResultAsync.fromPromise(
    Promise.resolve(createPayloadStudySession(id)),
    (error) => error as Error,
  ),
)
const fetchLockedQuestionVersionByIdResult = mock((id: string) =>
  ResultAsync.fromPromise(
    Promise.resolve(createPayloadQuestionVersion(id)),
    (error) => error as Error,
  ),
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
    const result = await getStudySessionQuestionByIndex(studySessionId, 0)

    expect(fetchStudySessionByIdResult).toHaveBeenCalledWith(studySessionId)
    expect(fetchLockedQuestionVersionByIdResult).toHaveBeenCalledWith(questionAVersionId)
    expect(result.isOk()).toBe(true)

    if (result.isErr()) {
      throw result.error
    }

    expect(result.value.question).toMatchObject({
      id: questionA,
      index: 1,
      version: questionAVersionId,
      shuffleKeyBase: `${studySessionId}:0:${questionA}`,
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
      studySessionId,
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
          skippedAt: null,
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
    fetchStudySessionByIdResult.mockImplementationOnce((id: string) =>
      ResultAsync.fromPromise(
        Promise.resolve({
          ...createPayloadStudySession(id),
          endedAt: '2026-05-01T00:00:00.000Z',
          questions: [
            createPayloadStudySessionQuestion(questionA),
            createPayloadStudySessionQuestion(questionB),
          ],
        } satisfies PayloadStudySessionForService),
        (error) => error as Error,
      ),
    )

    const result = await submitStudySessionQuestionAnswers(
      studySessionId,
      0,
      [{ partId: 'part-1', type: 'multipleChoice', choiceId: 'choice-a' }],
      { now },
    )

    expect(result.isOk()).toBe(true)

    const updatedSession = updateStudySessionResult.mock.calls[0]?.[0]
    expect(updatedSession?.state).toBe('started')
    expect(updatedSession?.endedAt).toBeUndefined()
  })

  it('clears skippedAt with null when answering a previously skipped question', async () => {
    const skippedAt = '2026-05-04T09:30:00.000Z'
    const now = new Date('2026-05-04T10:11:12.000Z')

    fetchStudySessionByIdResult.mockImplementationOnce((id: string) =>
      ResultAsync.fromPromise(
        Promise.resolve({
          ...createPayloadStudySession(id),
          questions: [
            {
              ...createPayloadStudySessionQuestion(questionA),
              status: 'skipped',
              skippedAt,
            },
          ],
        } satisfies PayloadStudySessionForService),
        (error) => error as Error,
      ),
    )

    const result = await submitStudySessionQuestionAnswers(
      studySessionId,
      0,
      [{ partId: 'part-1', type: 'multipleChoice', choiceId: 'choice-a' }],
      { now },
    )

    expect(result.isOk()).toBe(true)
    const updatedSession = updateStudySessionResult.mock.calls[0]?.[0]
    expect(updatedSession?.questions[0]).toMatchObject({
      status: 'answered',
      answeredAt: now.toISOString(),
      skippedAt: null,
    })
  })

  it('persists skipped status and leaves the session started', async () => {
    const now = new Date('2026-05-04T10:11:12.000Z')

    const result = await skipStudySessionQuestion(studySessionId, 0, { now })

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
    const result = await setStudySessionQuestionFlagged(studySessionId, 0, true)

    expect(result.isOk()).toBe(true)
    const updatedSession = updateStudySessionResult.mock.calls[0]?.[0]
    expect(updatedSession?.questions[0]?.flagged).toBe(true)
  })

  it('returns a business error for an out-of-range question index', async () => {
    const result = await getStudySessionQuestionByIndex(studySessionId, 99)

    expect(result.isErr()).toBe(true)
    if (result.isOk()) {
      throw new Error('Expected an error result')
    }
    expect(result.error).toBeInstanceOf(StudySessionQuestionIndexError)
  })

  it('returns a business error when submitting an already answered question', async () => {
    fetchStudySessionByIdResult.mockImplementationOnce((id: string) =>
      ResultAsync.fromPromise(
        Promise.resolve({
          ...createPayloadStudySession(id),
          state: 'finished',
          endedAt: '2026-05-04T10:11:12.000Z',
          questions: [
            {
              ...createPayloadStudySessionQuestion(questionA),
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

    const result = await submitStudySessionQuestionAnswers(studySessionId, 0, [
      { partId: 'part-1', type: 'multipleChoice', choiceId: 'choice-a' },
    ])

    expect(result.isErr()).toBe(true)
    if (result.isOk()) {
      throw new Error('Expected an error result')
    }
    expect(result.error).toBeInstanceOf(StudySessionQuestionAlreadyAnsweredError)
  })

  it('returns a business error when required answers are missing', async () => {
    const result = await submitStudySessionQuestionAnswers(studySessionId, 0, [])

    expect(result.isErr()).toBe(true)
    if (result.isOk()) {
      throw new Error('Expected an error result')
    }
    expect(result.error).toBeInstanceOf(StudySessionQuestionIncompleteAnswerError)
  })

  it('returns a business error when a short text answer is blank', async () => {
    fetchLockedQuestionVersionByIdResult.mockImplementationOnce((id: string) =>
      ResultAsync.fromPromise(
        Promise.resolve(createPayloadQuestionVersion(id, 'shortText')),
        (error) => error as Error,
      ),
    )

    const result = await submitStudySessionQuestionAnswers(studySessionId, 0, [
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

function createPayloadStudySession(id: string): PayloadStudySessionForService {
  return {
    id,
    state: 'started',
    begunAt: '2026-05-04T09:00:00.000Z',
    endedAt: undefined,
    questions: [createPayloadStudySessionQuestion(questionA)],
  } satisfies PayloadStudySessionForService
}

function createPayloadStudySessionQuestion(
  questionId: string,
): PayloadStudySessionForService['questions'][number] {
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
  const questionId = id.replace('version-', '')

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
