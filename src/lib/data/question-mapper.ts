import { type Result } from 'neverthrow'
import {
  renderableQuestionSchema,
  type RenderableQuestionSubmissionEvaluation,
  renderableQuestionSubmissionEvaluationSchema,
} from '@/lib/domain/question'
import { QuestionNotRenderableError } from '@/lib/errors'
import type {
  PayloadQuestionForAttempt as PayloadQuestionForRender,
  PayloadQuestionForReview as PayloadQuestionForEvaluation,
} from '@/lib/repository/question-repository'
import { parseToResult } from '@/lib/utils/validation'
import type {
  Question as PayloadQuestion,
  SubTopic as PayloadSubTopicDocument,
} from '@/payload/payload-types'
import * as R from 'remeda'

type PayloadQuestionToReviewSourceResult = Result<
  RenderableQuestionSubmissionEvaluation,
  QuestionNotRenderableError
>

type PayloadQuestionPart = PayloadQuestion['parts'][number]
type PayloadQuestionResponse = PayloadQuestionPart['response'] | undefined
type PayloadWorkedSolution = NonNullable<
  NonNullable<PayloadQuestionPart['workedSolutions']>[number]
>
type PayloadSubTopic = (number | PayloadSubTopicDocument) | null | undefined

export function payloadQuestionToAttempt(payloadQuestion: PayloadQuestionForRender) {
  const candidateQuestion = payloadQuestionToAttemptCandidate(payloadQuestion)

  return parseToResult(renderableQuestionSchema, candidateQuestion).mapErr(
    (error) => new QuestionNotRenderableError(error),
  )
}

export function payloadQuestionToReviewSource(
  payloadQuestion: PayloadQuestionForEvaluation,
): PayloadQuestionToReviewSourceResult {
  const candidateQuestion = payloadQuestionToReviewCandidate(payloadQuestion)

  return parseToResult(renderableQuestionSubmissionEvaluationSchema, candidateQuestion).mapErr(
    (error) => new QuestionNotRenderableError(error),
  )
}

export function payloadQuestionToAttemptCandidate(payloadQuestion: PayloadQuestionForRender) {
  const parts = Array.isArray(payloadQuestion.parts) ? payloadQuestion.parts : []
  const isMultipart = parts.length > 1

  return {
    id: payloadQuestion.id,
    version: 10, // todo just placeholder for now
    index: 1, // todo just placeholder for now
    prompt: payloadQuestion.prompt ?? undefined,
    subTopics: mapPayloadSubTopics(payloadQuestion.subTopics),
    parts: parts.map((payloadQuestionPart: PayloadQuestionPart) => ({
      id: payloadQuestionPart?.id ?? undefined,
      prompt: isMultipart ? (payloadQuestionPart?.prompt ?? undefined) : undefined,
      response: payloadResponseToAttemptCandidate(payloadQuestionPart?.response),
    })),
  }
}

function payloadQuestionToReviewCandidate(payloadQuestion: PayloadQuestionForEvaluation) {
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
        choices: R.pipe(
          payloadResponse.multipleChoice?.choices,
          (arr) => arr ?? [],
          R.filter(
            (choice): choice is typeof choice & { id: NonNullable<typeof choice.id> } =>
              choice.id !== undefined && choice.id !== null,
          ),
          R.map(
            (choice) =>
              [
                choice.id,
                {
                  id: choice.id,
                  text: choice.text,
                },
              ] as const,
          ),
          R.fromEntries(),
        ),
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

function mapPayloadSubTopics(payloadSubTopics: PayloadQuestionForRender['subTopics']) {
  if (!Array.isArray(payloadSubTopics)) {
    return []
  }

  return payloadSubTopics
    .map((payloadSubTopic) => mapPayloadSubTopic(payloadSubTopic))
    .filter(
      (payloadSubTopic): payloadSubTopic is NonNullable<typeof payloadSubTopic> =>
        payloadSubTopic != null,
    )
}

function mapPayloadSubTopic(payloadSubTopic: PayloadSubTopic) {
  if (!payloadSubTopic || typeof payloadSubTopic === 'number') {
    return undefined
  }

  if (!payloadSubTopic.topic || typeof payloadSubTopic.topic === 'number') {
    return undefined
  }

  return {
    id: payloadSubTopic.id,
    subtopicName: payloadSubTopic.name,
    topicName: payloadSubTopic.topic.name,
  }
}
