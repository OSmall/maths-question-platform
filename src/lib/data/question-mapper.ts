import {
  AnswerMechanism,
  MultipleChoiceAnswerMechanism,
  Question as DomainQuestion,
  QuestionPart,
} from '@/lib/domain/question'
import { Question as PayloadQuestion } from '@/payload/payload-types'
import { assertNever, toNonNullableOrThrow } from '@/lib/utils/types'
import { PayloadQuestionForDomain } from '@/lib/repository/question-repository'

export function payloadQuestionToDomain(payloadQuestion: PayloadQuestionForDomain): DomainQuestion {
  return {
    id: payloadQuestion.id,
    richText: payloadQuestion.overallQuestionRichText,
    parts: payloadQuestion.parts.map(payloadQuestionPartToDomain),
  }
}

function payloadQuestionPartToDomain(
  payloadQuestionPart: PayloadQuestion['parts'][number],
): QuestionPart {
  return {
    id: toNonNullableOrThrow(payloadQuestionPart.id),
    richText: payloadQuestionPart.partRichText ?? undefined,
    answerMechanism: payloadAnswerMechanismToDomain(payloadQuestionPart.answerMechanism[0]),
  }
}

function payloadAnswerMechanismToDomain(
  payloadAnswerMechanism: PayloadQuestion['parts'][number]['answerMechanism'][number],
): AnswerMechanism {
  switch (payloadAnswerMechanism.blockType) {
    case 'selfReport':
    case 'freeTextValidation':
      return {
        type: payloadAnswerMechanism.blockType,
      }
    case 'multipleChoice':
      return {
        type: payloadAnswerMechanism.blockType,
        choices: payloadAnswerMechanism.answers.map((answer) => {
          return {
            id: toNonNullableOrThrow(answer.id),
            text: answer.answer,
          } satisfies MultipleChoiceAnswerMechanism['choices'][number]
        }),
        shuffle: payloadAnswerMechanism.shuffle,
      }
    default:
      return assertNever(payloadAnswerMechanism)
  }
}
