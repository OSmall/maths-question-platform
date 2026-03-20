import { assertNever } from '@/lib/utils/types'
import type { QuestionPart } from '@/lib/domain/question'

import { QuestionFreeTextInput } from './question-free-text-input'
import { QuestionMultipleChoiceInput } from './question-multiple-choice-input'
import { QuestionSelfReportInput } from './question-self-report-input'

type QuestionPartInputProps = {
  part: QuestionPart
}

export const QuestionPartInput = ({ part }: QuestionPartInputProps) => {
  const response = part.response

  switch (response.type) {
    case 'multipleChoice':
      return <QuestionMultipleChoiceInput response={response} partId={part.id} />
    case 'selfReport':
      return <QuestionSelfReportInput />
    case 'shortText':
      return <QuestionFreeTextInput />
    default:
      assertNever(response)
  }
}
