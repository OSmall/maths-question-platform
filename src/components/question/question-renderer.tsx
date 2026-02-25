'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'

import { RichTextRenderer } from './rich-text-renderer'
import { assertNever } from '@/lib/utils/types'
import { MultipleChoiceAnswerMechanism, Question, QuestionPart } from '@/lib/domain/question'

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

const renderPartInput = (part: QuestionPart) => {
  const answerMechanism = part.answerMechanism

  if (!answerMechanism) {
    return null
  }

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

type QuestionRendererProps = {
  question: Question
}

export const QuestionRenderer = ({ question }: QuestionRendererProps) => {
  return (
    <div className="w-full max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            {/*<Badge variant="outline"></Badge>*/}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {question.richText !== undefined && <RichTextRenderer data={question.richText} />}
        </CardContent>
      </Card>

      {question.parts.map((part, index) => {
        return (
          <Card key={part.id}>
            <CardHeader>
              <CardTitle>Part {index + 1}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {part.richText !== undefined && <RichTextRenderer data={part.richText} />}
              {renderPartInput(part)}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
