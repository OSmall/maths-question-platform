import { afterEach, describe, expect, it, mock, vi } from 'bun:test'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { ResultAsync } from 'neverthrow'

import type { PayloadQuestionForAttempt } from '@/lib/repository/question-repository'
import { parseUUID } from '@/lib/domain/uuid'

const questionId = parseUUID('018f5f53-5c65-7a29-9b8d-9f8f9b9f9a03')

const queryPayloadForQuestionAttemptByIdAndDraftResult = mock((id: string, draft: boolean) =>
  ResultAsync.fromPromise(Promise.resolve(createPayloadQuestion(id, draft)), (error) => error as Error),
)

mock.module('@/lib/repository/question-repository', () => ({
  queryPayloadForQuestionAttemptByIdAndDraftResult,
}))

const { getQuestionById } = await import('@/lib/service/question-service')

describe('getQuestionById', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('passes the id and draft flag to the repository and applies the shuffle key base', async () => {
    queryPayloadForQuestionAttemptByIdAndDraftResult.mockImplementationOnce((id: string, draft: boolean) =>
      ResultAsync.fromPromise(
        Promise.resolve(createPayloadQuestion(id, draft)),
        (error) => error as Error,
      ),
    )

    const result = await getQuestionById(questionId, { draft: true, shuffleKeyBase: 'seed-123' })

    expect(queryPayloadForQuestionAttemptByIdAndDraftResult).toHaveBeenCalledWith(questionId, true)
    expect(result.isOk()).toBe(true)

    if (result.isErr()) {
      throw result.error
    }

    expect(result.value).toEqual({
      id: questionId,
      index: 1,
      version: `question-${questionId}`,
      shuffleKeyBase: 'seed-123',
      prompt: nonEmptyRichText,
      subTopics: [],
      parts: [
        {
          id: 'part-1',
          partNumber: 1,
          prompt: undefined,
          response: {
            type: 'multipleChoice',
            choices: { 'answer-1': { id: 'answer-1', text: 'Option A' } },
            shuffle: true,
          },
        },
      ],
    })
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

function createPayloadQuestion(id: string, shuffle: boolean): PayloadQuestionForAttempt {
  return {
    id,
    prompt: nonEmptyRichText,
    subTopics: [],
    parts: [
      {
        id: 'part-1',
        prompt: undefined,
        response: {
          type: 'multipleChoice',
          multipleChoice: {
            choices: [{ id: 'answer-1', text: 'Option A', isCorrect: true }],
            shuffle,
          },
        },
      },
    ],
  } as unknown as PayloadQuestionForAttempt
}
