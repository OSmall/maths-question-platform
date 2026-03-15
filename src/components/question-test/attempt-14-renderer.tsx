import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import type { MultipleChoiceAnswerMechanism, Question, QuestionPart } from '@/lib/domain/question'
import { assertNever } from '@/lib/utils/types'

import { RichTextRendererStatic } from './rich-text-renderer-static'

type Attempt14RendererProps = {
  question: Question
}

const renderMultipleChoiceInput = (
  partId: string,
  answerMechanism: MultipleChoiceAnswerMechanism,
) => {
  return (
    <RadioGroup className="grid gap-3">
      {answerMechanism.choices.map((choice, index) => {
        const optionId = `a14-${partId}-${choice.id}`

        return (
          <Label
            className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-muted"
            htmlFor={optionId}
            key={choice.id}
          >
            <RadioGroupItem className="mt-1" id={optionId} value={choice.id} />
            <span className="text-sm leading-6 text-card-foreground">
              <span className="mr-1.5 font-semibold">{String.fromCharCode(65 + index)}.</span>
              {choice.text}
            </span>
          </Label>
        )
      })}
    </RadioGroup>
  )
}

const renderSelfReportInput = () => {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <Button type="button" variant="default">
        I got it right
      </Button>
      <Button type="button" variant="outline">
        I need review
      </Button>
    </div>
  )
}

const renderFreeTextInput = () => {
  return <Textarea className="min-h-28" placeholder="Write your answer and reasoning" />
}

const renderPartInput = (part: QuestionPart) => {
  switch (part.answerMechanism.type) {
    case 'multipleChoice':
      return renderMultipleChoiceInput(part.id, part.answerMechanism)
    case 'selfReport':
      return renderSelfReportInput()
    case 'freeTextValidation':
      return renderFreeTextInput()
    default:
      assertNever(part.answerMechanism)
  }
}

export const Attempt14Renderer = ({ question }: Attempt14RendererProps) => {
  const totalParts = question.parts.length

  return (
    <section className="rounded-3xl border border-border bg-[linear-gradient(135deg,hsl(var(--muted))_0%,hsl(var(--background))_36%,hsl(var(--card))_100%)] p-4 shadow-sm sm:p-6 lg:p-8">
      <header className="mb-6 flex flex-wrap items-center gap-3">
        <Badge variant="outline">Split Studio</Badge>
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Question {question.id}
        </h1>
        <Badge className="ml-auto" variant="secondary">
          {totalParts} {totalParts === 1 ? 'part' : 'parts'}
        </Badge>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card className="h-fit border-border bg-card/95 lg:sticky lg:top-6">
          <CardHeader className="space-y-3">
            <CardTitle className="text-base font-semibold tracking-wide text-foreground uppercase">
              Prompt Context
            </CardTitle>
            <Separator />
          </CardHeader>
          <CardContent>
            {question.richText ? (
              <RichTextRendererStatic
                className="text-base leading-7 text-card-foreground"
                data={question.richText}
              />
            ) : (
              <p className="text-sm text-muted-foreground">No question prompt is provided.</p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {question.parts.map((part, index) => {
            return (
              <Card className="border-border bg-card" key={part.id}>
                <CardHeader className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Part {index + 1}</Badge>
                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      Workspace
                    </p>
                  </div>
                  <Separator />
                </CardHeader>

                <CardContent className="space-y-5">
                  {part.richText ? (
                    <RichTextRendererStatic
                      className="text-sm leading-7 text-card-foreground"
                      data={part.richText}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">This part has no extra prompt.</p>
                  )}

                  {renderPartInput(part)}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
