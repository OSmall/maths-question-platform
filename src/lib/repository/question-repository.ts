import { ResultAsync } from 'neverthrow'
import { getPayload } from 'payload'

import { handleRepositoryError } from '@/lib/repository/repository-utils'
import { Question } from '@/payload/collections/question'
import type { QuestionSelect } from '@/payload/payload-types'
import config from '@payload-config'
import * as R from 'remeda'
import z from 'zod'
import { questionResponseTypeSchema as questionPartResponseTypeSchema } from '../domain/question'
import { QuestionNotRenderableError } from '../errors'
import { assertNever } from '../utils/types'
import { parseToResult } from '../utils/validation'

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
    select: questionAttemptSelect,
  })
}

export function queryPayloadForQuestionAttemptByIdAndDraftResult(id: number, draft = false) {
  return ResultAsync.fromPromise(
    queryPayloadForQuestionAttemptByIdAndDraft(id, draft),
    handleRepositoryError(Question.slug, id),
  )
}

const questionReviewSelect = {
  parts: {
    id: true,
    response: {
      type: true,
      multipleChoice: {
        choices: {
          id: true,
          isCorrect: true,
        },
      },
      shortText: {
        acceptedAnswers: {
          id: true,
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

async function queryPayloadForQuestionPartTypes(id: number, draft: boolean) {
  const payload = await getPayload({ config })

  return payload.findByID({
    collection: 'question',
    id,
    draft,
    select: {
      parts: {
        id: true,
        response: {
          type: true,
        },
      },
    },
  })
}

/**
 * @returns object with keys partId and values part response type e.g. 'multipleChoice'
 */
export function fetchQuestionPartResponseTypes(id: number, draft = false) {
  return ResultAsync.fromPromise(
    queryPayloadForQuestionPartTypes(id, draft),
    handleRepositoryError(Question.slug, id),
  ).andThen((payloadResponse) => {
    const candidate = Object.fromEntries(
      payloadResponse.parts.map((part) => [part.id, part.response.type]),
    )
    const schema = z.record(z.string(), questionPartResponseTypeSchema)
    return parseToResult(schema, candidate).mapErr((err) => new QuestionNotRenderableError(err))
  })
}

async function queryPayloadForQuestionEvaluationEnrichment(questionId: number, draft = false) {
  const payload = await getPayload({ config })

  return payload.findByID({
    collection: 'question',
    id: questionId,
    draft,
    select: {
      parts: {
        id: true,
        response: {
          type: true,
          multipleChoice: {
            choices: {
              id: true,
              isCorrect: true,
            },
          },
          shortText: {
            acceptedAnswers: {
              id: true,
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
    },
  })
}

/**
 *
 * Will probably change when moving away from POC towards "StudySession"
 * @returns a candidate object ready to enrich the data from the user to make a full evaluation
 */
export function fetchQuestionEvaluationEnrichment(questionId: number, draft = false) {
  return ResultAsync.fromPromise(
    queryPayloadForQuestionEvaluationEnrichment(questionId, draft),
    handleRepositoryError(Question.slug, questionId),
  ).map((payloadResponse) =>
    R.pipe(
      payloadResponse.parts,
      R.map((part) => {
        if (part.response.type === 'shortText') {
          return [
            part.id!,
            {
              type: part.response.type,
              workedSolutions: part.workedSolutions,
              correctResponses: part.response.shortText?.acceptedAnswers?.map(
                (acceptedAnswer) => acceptedAnswer.value,
              ),
            },
          ] as const
        } else if (part.response.type === 'selfReport') {
          return [
            part.id!,
            {
              type: part.response.type,
              workedSolutions: part.workedSolutions,
            },
          ] as const
        } else if (part.response.type === 'multipleChoice') {
          const correctChoiceId = part.response.multipleChoice?.choices?.find(
            (choice) => choice.isCorrect,
          )?.id
          return [
            part.id!,
            {
              type: part.response.type,
              workedSolutions: part.workedSolutions,
              correctChoiceId,
            },
          ] as const
        } else {
          assertNever(part.response.type)
        }
      }),
      R.fromEntries(),
    ),
  )
}

export type PayloadQuestionForAttempt = Awaited<
  ReturnType<typeof queryPayloadForQuestionAttemptByIdAndDraft>
>
export type PayloadQuestionForReview = Awaited<
  ReturnType<typeof queryPayloadForQuestionReviewByIdAndDraft>
>
