import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

export type PartReviewStatus = 'correct' | 'incorrect' | 'unanswered'

export type QuestionWorkedSolutionReview = {
  id: string
  prompt: SerializedEditorState
}

export type QuestionReviewPart = {
  body: string
  correctAnswerText?: string
  status: PartReviewStatus
  title: string
  workedSolutions: QuestionWorkedSolutionReview[]
}

export type QuestionReviewPayload = {
  parts: Record<string, QuestionReviewPart>
}

export type SubmittedQuestionResponses = Record<string, string>
