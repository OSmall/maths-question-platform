import { type Result } from 'neverthrow'
import { questionSchema } from '@/lib/domain/question'
import { QuestionNotRenderableError } from '@/lib/errors'
import type { Question as PayloadQuestion } from '@/payload/payload-types'
import type { PayloadQuestionForDomain } from '@/lib/repository/question-repository'
import { z } from 'zod'
import { parseWithSchema } from '@/lib/utils/validation'

type PayloadQuestionToDomainResult = Result<
  z.output<typeof questionSchema>,
  QuestionNotRenderableError
>

export function payloadQuestionToDomain(
  payloadQuestion: PayloadQuestionForDomain,
): PayloadQuestionToDomainResult {
  const candidateQuestion = payloadQuestionToCandidate(payloadQuestion)

  return parseWithSchema(questionSchema, candidateQuestion).mapErr(
    (error) => new QuestionNotRenderableError(error),
  )
}

function payloadQuestionToCandidate(payloadQuestion: PayloadQuestionForDomain): QuestionCandidate {
  return {
    id: payloadQuestion.id,
    richText: payloadQuestion.overallQuestionRichText ?? undefined,
    parts: Array.isArray(payloadQuestion.parts)
      ? payloadQuestion.parts.map(payloadQuestionPartToCandidate)
      : undefined,
  }
}

function payloadQuestionPartToCandidate(payloadQuestionPart: PayloadQuestion['parts'][number]) {
  return {
    id: payloadQuestionPart?.id ?? undefined,
    richText: payloadQuestionPart?.partRichText ?? undefined,
    answerMechanism: payloadAnswerMechanismToCandidate(payloadQuestionPart?.answerMechanism?.[0]),
  }
}

function payloadAnswerMechanismToCandidate(
  payloadAnswerMechanism: PayloadQuestion['parts'][number]['answerMechanism'][number] | undefined,
) {
  switch (payloadAnswerMechanism?.blockType) {
    case 'selfReport':
    case 'freeTextValidation':
      return {
        type: payloadAnswerMechanism.blockType,
      }
    case 'multipleChoice':
      return {
        type: payloadAnswerMechanism.blockType,
        choices: Array.isArray(payloadAnswerMechanism.answers)
          ? payloadAnswerMechanism.answers.map((answer) => ({
              id: answer?.id ?? undefined,
              text: answer?.answer ?? undefined,
            }))
          : undefined,
        shuffle: payloadAnswerMechanism.shuffle,
      }
    default:
      return undefined
  }
}

type QuestionCandidate = {
  id?: number
  richText?: unknown
  parts?: QuestionPartCandidate[]
}

type QuestionPartCandidate = {
  id?: string
  richText?: unknown
  answerMechanism?: AnswerMechanismCandidate
}

type AnswerMechanismCandidate =
  | {
      type: 'selfReport'
    }
  | {
      type: 'freeTextValidation'
    }
  | {
      type: 'multipleChoice'
      choices?: MultipleChoiceChoiceCandidate[]
      shuffle?: boolean
    }

type MultipleChoiceChoiceCandidate = {
  id?: string
  text?: string
}
