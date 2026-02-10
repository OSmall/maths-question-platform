'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'

import { RichTextRenderer } from './rich-text-renderer'
import { Question } from '@/payload/payload-types'

type SimplifiedQuestionRendererProps = {
  question: Question
}

type QuestionPart = Question['parts'][number]
type MultipleChoiceAnswerMechanism = Extract<
  QuestionPart['answerMechanism'][number],
  { blockType: 'multipleChoice' }
>

const renderMultipleChoice = (answerMechanism: MultipleChoiceAnswerMechanism) => {
  return (
    <RadioGroup>
      {answerMechanism.answers.map((option) => {
        const inputId = `${answerMechanism.id}-${option.id}`

        return (
          <div
            className="rounded-xl border border-border bg-background/60 px-3 py-2"
            key={option.id}
          >
            <div className="flex items-center gap-3">
              <RadioGroupItem id={inputId} value={option.id} />
              <Label className="leading-normal" htmlFor={inputId}>
                {option.answer}
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
  const answerMechanism = part.answerMechanism[0]

  if (!answerMechanism) {
    return null
  }

  switch (answerMechanism.blockType) {
    case 'multipleChoice':
      return renderMultipleChoice(answerMechanism)
    case 'selfReport':
      return renderSelfReport()
    case 'freeTextValidation':
      return renderFreeText()
    default: {
      const _exhaustiveCheck: never = answerMechanism
      return null
    }
  }
}

export const QuestionRenderer = ({ question }: SimplifiedQuestionRendererProps) => {
  // if (question.parts.length === 0) {
  //   return (
  //     <Card className="w-full max-w-3xl">
  //       <CardHeader>
  //         <CardTitle>Question Preview Not Ready</CardTitle>
  //       </CardHeader>
  //       <CardContent>
  //         <p className="text-muted-foreground text-sm">
  //           This preview does not contain any question parts yet.
  //         </p>
  //       </CardContent>
  //     </Card>
  //   )
  // }

  return (
    <div className="w-full max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            {/*<Badge variant="outline"></Badge>*/}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <RichTextRenderer data={question.overallQuestionRichText} />
        </CardContent>
      </Card>

      {question.parts.map((part, index) => {
        return (
          <Card key={part.id}>
            <CardHeader>
              <CardTitle>Part {index + 1}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {part.partRichText !== null && part.partRichText !== undefined && (
                <RichTextRenderer data={part.partRichText} />
              )}
              {renderPartInput(part)}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

