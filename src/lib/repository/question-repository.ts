import { getPayload, NotFound } from 'payload'
import { ResultAsync } from 'neverthrow'

import config from '@payload-config'
import { payloadQuestionToAttempt, payloadQuestionToReviewSource } from '@/lib/data/question-mapper'
import { NotFoundError, PayloadQueryError } from '@/lib/errors'
import type { QuestionSelect } from '@/payload/payload-types'

export function fetchQuestionByIdAndDraft(id: number, draft: boolean) {
  return queryPayloadForQuestionAttemptByIdAndDraftResultAsync(id, draft).andThen(
    payloadQuestionToAttempt,
  )
}

export function fetchQuestionReviewSourceByIdAndDraft(id: number, draft: boolean) {
  return queryPayloadForQuestionReviewByIdAndDraftResultAsync(id, draft).andThen(
    payloadQuestionToReviewSource,
  )
}

function queryPayloadForQuestionAttemptByIdAndDraftResultAsync(id: number, draft = false) {
  return ResultAsync.fromPromise(queryPayloadForQuestionAttemptByIdAndDraft(id, draft), (err) => {
    if (err instanceof NotFound) {
      return new NotFoundError('Question', id, { cause: err })
    }

    return new PayloadQueryError(err)
  })
}

function queryPayloadForQuestionReviewByIdAndDraftResultAsync(id: number, draft = false) {
  return ResultAsync.fromPromise(queryPayloadForQuestionReviewByIdAndDraft(id, draft), (err) => {
    if (err instanceof NotFound) {
      return new NotFoundError('Question', id, { cause: err })
    }

    return new PayloadQueryError(err)
  })
}

const questionAttemptSelect = {
  prompt: true,
  subTopics: true,
  parts: {
    id: true,
    prompt: true,
    response: {
      type: true,
      multipleChoice: {
        choices: {
          id: true,
          text: true,
        },
        shuffle: true,
      },
      shortText: {},
      selfReport: {},
    },
  },
} as const

const questionReviewSelect = {
  parts: {
    id: true,
    prompt: true,
    response: {
      type: true,
      multipleChoice: {
        choices: {
          id: true,
          text: true,
          isCorrect: true,
        },
        shuffle: true,
      },
      shortText: {
        acceptedAnswers: {
          value: true,
        },
      },
      selfReport: {},
    },
    workedSolutions: {
      id: true,
      prompt: true,
    },
  },
} as const satisfies QuestionSelect

async function queryPayloadForQuestionAttemptByIdAndDraft(id: number, draft: boolean) {
  const payload = await getPayload({ config })

  return payload.findByID({
    collection: 'question',
    id,
    draft,
    depth: 2,
    populate: {
      media: {
        alt: true,
        filename: true,
        height: true,
        mimeType: true,
        url: true,
        width: true,
      },
    },
    select: questionAttemptSelect as QuestionSelect,
  })
}

async function queryPayloadForQuestionReviewByIdAndDraft(id: number, draft: boolean) {
  const payload = await getPayload({ config })

  return payload.findByID({
    collection: 'question',
    id,
    draft,
    depth: 2,
    populate: {
      media: {
        alt: true,
        filename: true,
        height: true,
        mimeType: true,
        url: true,
        width: true,
      },
    },
    select: questionReviewSelect,
  })
}

export type PayloadQuestionForAttempt = Awaited<
  ReturnType<typeof queryPayloadForQuestionAttemptByIdAndDraft>
>
export type PayloadQuestionForReview = Awaited<
  ReturnType<typeof queryPayloadForQuestionReviewByIdAndDraft>
>
