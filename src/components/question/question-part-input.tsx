'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { assertNever } from '@/lib/utils/types'
import type { MultipleChoiceAnswerMechanism, QuestionPart } from '@/lib/domain/question'

const renderMultipleChoice = (answerMechanism: MultipleChoiceAnswerMechanism) => {
  return (
    <RadioGroup>
      {answerMechanism.choices.map((choice) => {
        const key = `choice-${choice.id}`
        return (
          <div className="rounded-xl border border-border bg-background/60 px-3 py-2" key={key}>
            <div className="flex items-center gap-3">
              <RadioGroupItem id={key} value={choice.id} />
              <Label className="leading-normal" htmlFor={key}>
                {choice.text}
              </Label>
            </div>
          </div>
        )
      })}
    </RadioGroup>
  )
}

const renderSelfReport = () => {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <Button type="button" variant="outline">
        Answered Correctly
      </Button>
      <Button type="button" variant="outline">
        Answered Incorrectly
      </Button>
    </div>
  )
}

const renderFreeText = () => {
  return <Textarea className="min-h-24" defaultValue="" placeholder="Enter your answer" />
}

type QuestionPartInputProps = {
  part: QuestionPart
}

export const QuestionPartInput = ({ part }: QuestionPartInputProps) => {
  const answerMechanism = part.answerMechanism

  switch (answerMechanism.type) {
    case 'multipleChoice':
      return renderMultipleChoice(answerMechanism)
    case 'selfReport':
      return renderSelfReport()
    case 'freeTextValidation':
      return renderFreeText()
    default:
      assertNever(answerMechanism)
  }
}
