import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

export type MultipleChoiceAnswerMechanism = {
  type: 'multipleChoice'
  choices: {
    id: string
    text: string
  }[]
  shuffle: boolean
}

type SelfReportAnswerMechanism = {
  type: 'selfReport'
}

type FreeTextAnswerMechanism = {
  type: 'freeTextValidation'
}

export type AnswerMechanism =
  | FreeTextAnswerMechanism
  | SelfReportAnswerMechanism
  | MultipleChoiceAnswerMechanism

export interface QuestionPart {
  id: string
  richText?: SerializedEditorState
  answerMechanism: AnswerMechanism
}

/**
 * Ready to be rendered in the UI
 */
export interface Question {
  id: number
  richText?: SerializedEditorState
  parts: QuestionPart[]
}
