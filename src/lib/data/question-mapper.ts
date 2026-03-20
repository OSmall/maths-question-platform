import { type Result } from 'neverthrow'
import { z } from 'zod'

import {
  questionReviewSourceSchema,
  questionSchema,
  type QuestionReviewSource,
} from '@/lib/domain/question'
import { QuestionNotRenderableError } from '@/lib/errors'
import type {
  PayloadQuestionForAttempt,
  PayloadQuestionForReview,
} from '@/lib/repository/question-repository'
import { parseWithSchema } from '@/lib/utils/validation'
import type {
  Question as PayloadQuestion,
  SubTopic as PayloadSubTopicDocument,
} from '@/payload/payload-types'

type PayloadQuestionToDomainResult = Result<
  z.output<typeof questionSchema>,
  QuestionNotRenderableError
>

type PayloadQuestionToReviewSourceResult = Result<QuestionReviewSource, QuestionNotRenderableError>

type PayloadQuestionPart = PayloadQuestion['parts'][number]
type PayloadQuestionResponse = PayloadQuestionPart['response'] | undefined
type PayloadWorkedSolution = NonNullable<
  NonNullable<PayloadQuestionPart['workedSolutions']>[number]
>
type PayloadSubTopic = (number | PayloadSubTopicDocument) | null | undefined

export function payloadQuestionToAttempt(
  payloadQuestion: PayloadQuestionForAttempt,
): PayloadQuestionToDomainResult {
  const candidateQuestion = payloadQuestionToAttemptCandidate(payloadQuestion)

  return parseWithSchema(questionSchema, candidateQuestion).mapErr(
    (error) => new QuestionNotRenderableError(error),
  )
}

export function payloadQuestionToReviewSource(
  payloadQuestion: PayloadQuestionForReview,
): PayloadQuestionToReviewSourceResult {
  const candidateQuestion = payloadQuestionToReviewCandidate(payloadQuestion)

  return parseWithSchema(questionReviewSourceSchema, candidateQuestion).mapErr(
    (error) => new QuestionNotRenderableError(error),
  )
}

function payloadQuestionToAttemptCandidate(payloadQuestion: PayloadQuestionForAttempt) {
  const parts = Array.isArray(payloadQuestion.parts) ? payloadQuestion.parts : []
  const isMultipart = parts.length > 1

  return {
    id: payloadQuestion.id,
    prompt: payloadQuestion.prompt ?? undefined,
    subTopics: mapPayloadSubTopics(payloadQuestion.subTopics),
    parts: parts.map((payloadQuestionPart: PayloadQuestionPart) => ({
      id: payloadQuestionPart?.id ?? undefined,
      prompt: isMultipart ? (payloadQuestionPart?.prompt ?? undefined) : undefined,
      response: payloadResponseToAttemptCandidate(payloadQuestionPart?.response),
    })),
  }
}

function payloadQuestionToReviewCandidate(payloadQuestion: PayloadQuestionForReview) {
  return {
    id: payloadQuestion.id,
    parts: Array.isArray(payloadQuestion.parts)
      ? payloadQuestion.parts.map((payloadQuestionPart: PayloadQuestionPart) => ({
          id: payloadQuestionPart?.id ?? undefined,
          prompt: payloadQuestionPart?.prompt ?? undefined,
          response: payloadResponseToReviewCandidate(payloadQuestionPart?.response),
          workedSolutions: Array.isArray(payloadQuestionPart?.workedSolutions)
            ? payloadQuestionPart.workedSolutions
                .map((workedSolution: PayloadWorkedSolution) => ({
                  id: workedSolution?.id ?? undefined,
                  prompt: workedSolution?.prompt ?? undefined,
                }))
                .filter(
                  (workedSolution: { id?: string; prompt?: unknown }) =>
                    typeof workedSolution.id === 'string' && workedSolution.prompt != null,
                )
            : [],
        }))
      : undefined,
  }
}

function payloadResponseToAttemptCandidate(payloadResponse: PayloadQuestionResponse) {
  switch (payloadResponse?.type) {
    case 'selfReport':
    case 'shortText':
      return {
        type: payloadResponse.type,
      }
    case 'multipleChoice':
      return {
        type: payloadResponse.type,
        choices: Array.isArray(payloadResponse.multipleChoice?.choices)
          ? payloadResponse.multipleChoice.choices.map((choice) => ({
              id: choice?.id ?? undefined,
              text: choice?.text ?? undefined,
            }))
          : undefined,
        shuffle: payloadResponse.multipleChoice?.shuffle,
      }
    default:
      return undefined
  }
}

function payloadResponseToReviewCandidate(payloadResponse: PayloadQuestionResponse) {
  switch (payloadResponse?.type) {
    case 'selfReport':
      return {
        type: 'selfReport',
      }
    case 'shortText':
      return {
        type: 'shortText',
        acceptedAnswers: Array.isArray(payloadResponse.shortText?.acceptedAnswers)
          ? payloadResponse.shortText.acceptedAnswers.map((answer) => answer?.value ?? undefined)
          : undefined,
      }
    case 'multipleChoice':
      return {
        type: 'multipleChoice',
        choices: Array.isArray(payloadResponse.multipleChoice?.choices)
          ? payloadResponse.multipleChoice.choices.map((choice) => ({
              id: choice?.id ?? undefined,
              text: choice?.text ?? undefined,
              isCorrect: choice?.isCorrect,
            }))
          : undefined,
      }
    default:
      return undefined
  }
}

function mapPayloadSubTopics(payloadSubTopics: unknown) {
  if (!Array.isArray(payloadSubTopics)) {
    return []
  }

  return payloadSubTopics
    .map((payloadSubTopic) => mapPayloadSubTopic(payloadSubTopic as PayloadSubTopic))
    .filter(
      (payloadSubTopic): payloadSubTopic is NonNullable<typeof payloadSubTopic> =>
        payloadSubTopic != null,
    )
}

function mapPayloadSubTopic(payloadSubTopic: PayloadSubTopic) {
  if (!payloadSubTopic || typeof payloadSubTopic === 'number') {
    return undefined
  }

  if (
    typeof payloadSubTopic.id !== 'number' ||
    typeof payloadSubTopic.name !== 'string' ||
    !payloadSubTopic.topic ||
    typeof payloadSubTopic.topic === 'number' ||
    typeof payloadSubTopic.topic.name !== 'string'
  ) {
    return undefined
  }

  return {
    id: payloadSubTopic.id,
    name: payloadSubTopic.name,
    topicName: payloadSubTopic.topic.name,
  }
}
