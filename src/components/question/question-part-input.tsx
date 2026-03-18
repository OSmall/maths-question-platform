import { assertNever } from '@/lib/utils/types'
import type { QuestionPart } from '@/lib/domain/question'

import { QuestionFreeTextInput } from './question-free-text-input'
import { QuestionMultipleChoiceInput } from './question-multiple-choice-input'
import { QuestionSelfReportInput } from './question-self-report-input'

type QuestionPartInputProps = {
  part: QuestionPart
}

export const QuestionPartInput = ({ part }: QuestionPartInputProps) => {
  const answerMechanism = part.answerMechanism

  switch (answerMechanism.type) {
    case 'multipleChoice':
      return <QuestionMultipleChoiceInput answerMechanism={answerMechanism} partId={part.id} />
    case 'selfReport':
      return <QuestionSelfReportInput />
    case 'freeTextValidation':
      return <QuestionFreeTextInput />
    default:
      assertNever(answerMechanism)
  }
}
