import type { Question } from '@/lib/domain/question'
import type {
  ReviewQuestionSubmissionResult,
  SubmittedQuestionResponses,
} from '@/lib/domain/question-review'

import { QuestionStudyExperience } from './question-study-experience'
import type { QuestionSessionMeta } from './question-study-types'

type QuestionRendererProps = {
  isDraftMode?: boolean
  question: Question
  reviewQuestionAction: (args: {
    questionId: number
    responses: SubmittedQuestionResponses
  }) => Promise<ReviewQuestionSubmissionResult>
}

export const QuestionRenderer = ({
  isDraftMode = false,
  question,
  reviewQuestionAction,
}: QuestionRendererProps) => {
  return (
    <QuestionStudyExperience
      isDraftMode={isDraftMode}
      question={question}
      reviewQuestionAction={reviewQuestionAction}
      sessionMeta={buildSessionMeta(question)}
    />
  )
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
