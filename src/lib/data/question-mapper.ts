import type { PayloadQuestionForAttempt as PayloadQuestionForRender } from '@/lib/repository/question-repository'
import type {
  Question as PayloadQuestion,
  SubTopic as PayloadSubTopicDocument,
} from '@/payload/payload-types'
import * as R from 'remeda'

type PayloadQuestionPart = PayloadQuestion['parts'][number]
type PayloadQuestionResponse = PayloadQuestionPart['response'] | undefined
type PayloadSubTopic = (number | PayloadSubTopicDocument) | null | undefined

export function payloadQuestionToAttemptCandidate(payloadQuestion: PayloadQuestionForRender) {
  const parts = Array.isArray(payloadQuestion.parts) ? payloadQuestion.parts : []
  const isMultipart = parts.length > 1

  return {
    id: payloadQuestion.id,
    version: `question-${payloadQuestion.id}`,
    index: 0,
    prompt: payloadQuestion.prompt ?? undefined,
    subTopics: mapPayloadSubTopics(payloadQuestion.subTopics),
    parts: parts.map((payloadQuestionPart: PayloadQuestionPart) => ({
      id: payloadQuestionPart?.id ?? undefined,
      prompt: isMultipart ? (payloadQuestionPart?.prompt ?? undefined) : undefined,
      response: payloadResponseToAttemptCandidate(payloadQuestionPart?.response),
    })),
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
