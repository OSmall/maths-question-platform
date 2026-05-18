import type { TypeWithVersion } from 'payload'
import * as R from 'remeda'

import type {
  StudySession,
  StudySessionAnswer,
  StudySessionQuestion,
} from '@/lib/domain/study-session'
import type {
  Question as PayloadQuestion,
  StudySession as PayloadStudySession,
} from '@/payload/payload-types'
import { extractRelationshipId } from '@/payload/collections/study-session-utils'
import { assertNever, toNonNullableOrThrow } from '@/lib/utils/types'

type PayloadQuestionPart = PayloadQuestion['parts'][number]
type PayloadQuestionResponse = PayloadQuestionPart['response'] | undefined
type PayloadStudySessionForMapper = Pick<
  PayloadStudySession,
  'begunAt' | 'endedAt' | 'id' | 'questions' | 'state'
>
type PayloadStudySessionQuestion = PayloadStudySession['questions'][number]
type PayloadStudySessionAnswer = NonNullable<PayloadStudySessionQuestion['answers']>[number]
type PayloadQuestionVersion = TypeWithVersion<PayloadQuestion>
type PayloadSubTopic = NonNullable<PayloadQuestion['subTopics']>[number]

export function payloadStudySessionToDomainCandidate(
  payloadStudySession: PayloadStudySessionForMapper,
): StudySession {
  return {
    id: payloadStudySession.id,
    state: toNonNullableOrThrow(payloadStudySession.state),
    begunAt: payloadStudySession.begunAt ?? undefined,
    endedAt: payloadStudySession.endedAt ?? undefined,
    questions: payloadStudySession.questions.map((question, index) =>
      payloadStudySessionQuestionToDomainCandidate(question, index),
    ),
  }
}

export function payloadQuestionVersionToRenderableQuestionCandidate({
  index,
  payloadQuestionVersion,
  shuffleKeyBase,
}: {
  index: number
  payloadQuestionVersion: PayloadQuestionVersion
  shuffleKeyBase: string
}) {
  const payloadQuestion = payloadQuestionVersion.version
  const parts = Array.isArray(payloadQuestion.parts) ? payloadQuestion.parts : []
  const isMultipart = parts.length > 1

  return {
    id: assertPayloadQuestionParentId(payloadQuestionVersion),
    version: String(payloadQuestionVersion.id),
    index,
    prompt: payloadQuestion.prompt ?? undefined,
    subTopics: mapPayloadSubTopics(payloadQuestion.subTopics),
    shuffleKeyBase,
    parts: parts.map((payloadQuestionPart: PayloadQuestionPart) => ({
      id: payloadQuestionPart?.id ?? undefined,
      prompt: isMultipart ? (payloadQuestionPart?.prompt ?? undefined) : undefined,
      response: payloadResponseToRenderableQuestionPartCandidate(payloadQuestionPart?.response),
    })),
  }
}

export function buildStudySessionQuestionSubmissionEvaluationCandidate({
  payloadQuestionVersion,
  studySessionQuestion,
}: {
  payloadQuestionVersion: PayloadQuestionVersion
  studySessionQuestion: StudySessionQuestion
}): unknown {
  const answersByPartId = R.indexBy(studySessionQuestion.answers, (answer) => answer.partId)
  const parts = payloadQuestionVersion.version.parts.map((part) => {
    if (!part.id) {
      throw new Error(
        `Locked question version ${payloadQuestionVersion.id} has a part without an id.`,
      )
    }

    const answer = answersByPartId[part.id]
    if (!answer) {
      throw new Error(
        `Study session question ${studySessionQuestion.index} is missing answer row for part ${part.id}.`,
      )
    }

    return [part.id, buildQuestionSubmissionEvaluationPart(part, answer)] as const
  })

  const partRecord = R.fromEntries(parts)

  if (studySessionQuestion.status !== 'answered') {
    return {
      isEvaluated: false,
      answeredParts: studySessionQuestion.answers.filter((answer) => answer.type !== 'unanswered')
        .length,
      parts: partRecord,
    }
  }

  const evaluatedPartRecord = partRecord as Record<string, { isCorrect: boolean }>
  const correctParts = R.pipe(
    evaluatedPartRecord,
    R.values(),
    R.sumBy((part) => (part.isCorrect ? 1 : 0)),
  )

  return {
    isEvaluated: true,
    answeredParts: parts.length,
    correctParts,
    incorrectParts: parts.length - correctParts,
    parts: partRecord,
  }
}

function payloadStudySessionQuestionToDomainCandidate(
  question: PayloadStudySessionQuestion,
  index: number,
): StudySessionQuestion {
  return {
    id: question.id ?? undefined,
    index,
    questionId: extractRequiredRelationshipId(question.question, 'study session question'),
    questionVersionId: toNonNullableOrThrow(question.questionVersionId),
    status: question.status,
    flagged: question.flagged,
    answeredAt: question.answeredAt ?? undefined,
    skippedAt: question.skippedAt ?? undefined,
    answers: (question.answers ?? []).map(payloadStudySessionAnswerToDomainCandidate),
  }
}

function payloadStudySessionAnswerToDomainCandidate(
  answer: PayloadStudySessionAnswer,
): StudySessionAnswer {
  switch (answer.type) {
    case 'unanswered':
      return {
        partId: answer.partId,
        type: answer.type,
      }
    case 'multipleChoice':
      return {
        partId: answer.partId,
        type: answer.type,
        choiceId: toNonNullableOrThrow(answer.multipleChoice?.choiceId),
      }
    case 'shortText':
      return {
        partId: answer.partId,
        type: answer.type,
        answer: toNonNullableOrThrow(answer.shortText?.answer),
      }
    case 'selfReport':
      return {
        partId: answer.partId,
        type: answer.type,
        answer: toNonNullableOrThrow(answer.selfReport?.answer),
      }
    default:
      return assertNever(answer.type)
  }
}

function payloadResponseToRenderableQuestionPartCandidate(
  payloadResponse: PayloadQuestionResponse,
) {
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

function buildQuestionSubmissionEvaluationPart(
  payloadQuestionPart: PayloadQuestionPart,
  answer: StudySessionAnswer,
) {
  const response = payloadQuestionPart.response
  const workedSolutions = payloadQuestionPart.workedSolutions ?? []

  if (answer.type === 'unanswered') {
    return buildUnevaluatedQuestionSubmissionPart(response.type)
  }

  if (response.type === 'shortText') {
    if (answer.type !== 'shortText') {
      throwMismatchedAnswerType(payloadQuestionPart, answer.type)
    }

    const correctResponses = (response.shortText?.acceptedAnswers ?? []).map(
      (acceptedAnswer) => acceptedAnswer.value,
    )
    return {
      type: response.type,
      givenResponse: answer.answer,
      correctResponses,
      workedSolutions,
      isCorrect: correctResponses.includes(answer.answer),
    }
  }

  if (response.type === 'selfReport') {
    if (answer.type !== 'selfReport') {
      throwMismatchedAnswerType(payloadQuestionPart, answer.type)
    }

    return {
      type: response.type,
      givenResponse: answer.answer,
      workedSolutions,
      isCorrect: answer.answer,
    }
  }

  if (answer.type !== 'multipleChoice') {
    throwMismatchedAnswerType(payloadQuestionPart, answer.type)
  }

  const correctChoiceId = response.multipleChoice?.choices?.find((choice) => choice.isCorrect)?.id
  if (!correctChoiceId) {
    throw new Error(`Multiple-choice part ${payloadQuestionPart.id} has no correct choice.`)
  }

  return {
    type: response.type,
    givenChoiceId: answer.choiceId,
    correctChoiceId,
    workedSolutions,
    isCorrect: correctChoiceId === answer.choiceId,
  }
}

function throwMismatchedAnswerType(
  payloadQuestionPart: PayloadQuestionPart,
  answerType: string,
): never {
  throw new Error(
    `Answer type ${answerType} does not match question part ${payloadQuestionPart.id} type ${payloadQuestionPart.response.type}.`,
  )
}

function buildUnevaluatedQuestionSubmissionPart(type: PayloadQuestionPart['response']['type']) {
  switch (type) {
    case 'multipleChoice':
      return { type }
    case 'shortText':
      return { type }
    case 'selfReport':
      return { type }
  }
}

function mapPayloadSubTopics(payloadSubTopics: PayloadQuestion['subTopics']) {
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

function mapPayloadSubTopic(payloadSubTopic: PayloadSubTopic | null | undefined) {
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

function assertPayloadQuestionParentId(payloadQuestionVersion: PayloadQuestionVersion) {
  const parentId = extractRelationshipId(payloadQuestionVersion.parent)
  if (parentId === undefined) {
    throw new Error(`Locked question version ${payloadQuestionVersion.id} has invalid parent.`)
  }
  return parentId
}

function extractRequiredRelationshipId(value: unknown, fieldName: string) {
  const id = extractRelationshipId(value)
  if (id === undefined) {
    throw new Error(`Invalid ${fieldName} relationship.`)
  }
  return id
}
