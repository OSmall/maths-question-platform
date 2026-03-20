import { afterEach, describe, expect, it, mock, vi } from 'bun:test'
import { ResultAsync } from 'neverthrow'

import { NotANumberError } from '@/lib/errors'
import type { Question } from '@/lib/domain/question'

const fetchQuestionByIdAndDraft = mock((id: number, draft: boolean) =>
  ResultAsync.fromPromise(Promise.resolve(createQuestion(id, draft)), (error) => error as Error),
)

mock.module('@/lib/repository/question-repository', () => ({
  fetchQuestionByIdAndDraft,
}))

const { getQuestionById } = await import('@/lib/service/question-service')

describe('getQuestionById', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('parses the id string and passes the draft flag to the repository', async () => {
    const expectedQuestion = createQuestion(42, true)
    fetchQuestionByIdAndDraft.mockImplementationOnce((id: number, draft: boolean) =>
      ResultAsync.fromPromise(
        Promise.resolve(createQuestion(id, draft)),
        (error) => error as Error,
      ),
    )

    const result = await getQuestionById('42', { draft: true })

    expect(fetchQuestionByIdAndDraft).toHaveBeenCalledWith(42, true)
    expect(result.isOk()).toBe(true)

    if (result.isErr()) {
      throw result.error
    }

    expect(result.value).toEqual(expectedQuestion)
  })

  it('returns a not-a-number error without querying the repository', async () => {
    const result = await getQuestionById('abc')

    expect(fetchQuestionByIdAndDraft).not.toHaveBeenCalled()
    expect(result.isErr()).toBe(true)

    if (result.isOk()) {
      throw new Error('Expected an error result')
    }

    expect(result.error).toBeInstanceOf(NotANumberError)
  })
})

function createQuestion(id: number, shuffle: boolean): Question {
  return {
    id,
    prompt: undefined,
    subTopics: [],
    parts: [
      {
        id: 'part-1',
        prompt: undefined,
        response: {
          type: 'multipleChoice',
          choices: [{ id: 'answer-1', text: 'Option A' }],
          shuffle,
        },
      },
    ],
  }
}
