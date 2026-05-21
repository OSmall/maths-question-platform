import { afterEach, describe, expect, it, mock, vi } from 'bun:test'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { ResultAsync } from 'neverthrow'

import type { PayloadQuestionForAttempt } from '@/lib/repository/question-repository'

const queryPayloadForQuestionAttemptByIdAndDraftResult = mock((id: number, draft: boolean) =>
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
    queryPayloadForQuestionAttemptByIdAndDraftResult.mockImplementationOnce((id: number, draft: boolean) =>
      ResultAsync.fromPromise(
        Promise.resolve(createPayloadQuestion(id, draft)),
        (error) => error as Error,
      ),
    )

    const result = await getQuestionById(42, { draft: true, shuffleKeyBase: 'seed-123' })

    expect(queryPayloadForQuestionAttemptByIdAndDraftResult).toHaveBeenCalledWith(42, true)
    expect(result.isOk()).toBe(true)

    if (result.isErr()) {
      throw result.error
    }

    expect(result.value).toEqual({
      id: 42,
      index: 1,
      version: 'question-42',
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

function createPayloadQuestion(id: number, shuffle: boolean): PayloadQuestionForAttempt {
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
