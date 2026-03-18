import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

import type { Question } from '@/lib/domain/question'

export type QuestionSessionMeta = {
  attemptLabel: string
  estimatedMinutes: number
  aspectLabels: string[]
  sessionAccuracyPercent: number
  sessionFlaggedCount: number
  sessionProgressCurrent: number
  sessionProgressTotal: number
  timeSpentLabel: string
  topicLabel: string
}

export type QuestionReviewPayload = {
  nextQuestionLabel: string
  parts: Record<string, QuestionReviewPart>
}

export type QuestionReviewPart = {
  answerType: Question['parts'][number]['answerMechanism']['type']
  correctAnswerText?: string
  correctChoiceId?: string
  explanation: string
  solutionMethods: QuestionSolutionMethod[]
}

export type QuestionSolutionMethod = {
  id: string
  richText: SerializedEditorState
  title: string
}
