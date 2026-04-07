export type QuestionSessionMeta = {
  attemptLabel: string
  estimatedMinutes: number
  sessionAccuracyPercent: number
  sessionFlaggedCount: number
  sessionProgressCurrent: number
  sessionProgressTotal: number
  timeSpentLabel: string
}

export type QuestionReviewSummary = {
  accuracyPercent: number
  answeredCount: number
  completionPercent: number
  correctCount: number
  incorrectCount: number
  unansweredCount: number
}
