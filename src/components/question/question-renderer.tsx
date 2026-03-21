import type { Question } from '@/lib/domain/question'
import type {
  QuestionReviewPayload,
  SubmittedQuestionResponses,
} from '@/lib/domain/question-review'
import { reviewQuestionSubmissionById } from '@/lib/service/question-review-service'

import { QuestionStudyExperience } from './question-study-experience'
import type { QuestionReviewSummary, QuestionSessionMeta } from './question-study-types'

type QuestionRendererProps = {
  isDraftMode?: boolean
  question: Question
  searchParams: Record<string, string | string[] | undefined>
}

export const QuestionRenderer = async ({
  isDraftMode = false,
  question,
  searchParams,
}: QuestionRendererProps) => {
  const submittedResponses = sanitizeResponses(question, decodeResponses(searchParams))
  const isSubmitted = getSingleSearchParam(searchParams.submitted) === '1'
  const reviewResult = isSubmitted
    ? await reviewQuestionSubmissionById(question.id, submittedResponses, { draft: isDraftMode })
    : null

  const reviewPayload =
    reviewResult?.match(
      (payload) => payload,
      () => null,
    ) ?? null

  const reviewError =
    reviewResult?.match(
      () => null,
      (error) => error.message,
    ) ?? null

  const reviewSummary = buildReviewSummary(question, submittedResponses, reviewPayload)

  return (
    <QuestionStudyExperience
      isDraftMode={isDraftMode}
      question={question}
      responses={submittedResponses}
      reviewError={reviewError}
      reviewPayload={reviewPayload}
      reviewSummary={reviewSummary}
      seed={getSingleSearchParam(searchParams.seed) ?? ''}
      sessionMeta={buildSessionMeta(question)}
    />
  )
}

function getSingleSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value.at(-1)
  }

  return value
}

function decodeResponses(searchParams: Record<string, string | string[] | undefined>) {
  const responses: SubmittedQuestionResponses = {}

  for (const [key, value] of Object.entries(searchParams)) {
    if (!key.startsWith('a.')) {
      continue
    }

    const partId = key.slice(2)
    const submittedValue = getSingleSearchParam(value)

    if (!partId || !submittedValue) {
      continue
    }

    responses[partId] = submittedValue
  }

  return responses
}

function sanitizeResponses(question: Question, responses: SubmittedQuestionResponses) {
  const allowedPartIds = new Set(question.parts.map((part) => part.id))

  return Object.fromEntries(
    Object.entries(responses).filter(
      ([partId, value]) => allowedPartIds.has(partId) && value.trim(),
    ),
  ) as SubmittedQuestionResponses
}

function buildReviewSummary(
  question: Question,
  responses: SubmittedQuestionResponses,
  reviewPayload: QuestionReviewPayload | null,
): QuestionReviewSummary | null {
  if (!reviewPayload) {
    return null
  }

  const results = Object.values(reviewPayload.parts)
  const correctCount = results.filter((result) => result.status === 'correct').length
  const incorrectCount = results.filter((result) => result.status === 'incorrect').length
  const unansweredCount = results.filter((result) => result.status === 'unanswered').length
  const answeredCount = question.parts.filter((part) => Boolean(responses[part.id]?.trim())).length

  return {
    accuracyPercent: Math.round((correctCount / question.parts.length) * 100),
    answeredCount,
    completionPercent: Math.round((answeredCount / question.parts.length) * 100),
    correctCount,
    incorrectCount,
    unansweredCount,
  }
}

function buildSessionMeta(question: Question): QuestionSessionMeta {
  const sessionProgressCurrent = ((question.id + question.parts.length) % 8) + 4
  const sessionProgressTotal = Math.max(sessionProgressCurrent + 7, 20)

  return {
    attemptLabel: `Attempt #${((question.id + 6) % 9) + 1}`,
    estimatedMinutes: Math.max(4, question.parts.length * 3),
    sessionAccuracyPercent: 84,
    sessionFlaggedCount: question.parts.length > 1 ? 1 : 0,
    sessionProgressCurrent,
    sessionProgressTotal,
    timeSpentLabel: `${String(question.parts.length + 5).padStart(2, '0')}:${String((question.id * 7) % 60).padStart(2, '0')}`,
  }
}
