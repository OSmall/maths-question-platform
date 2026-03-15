import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import type { MultipleChoiceAnswerMechanism, Question, QuestionPart } from '@/lib/domain/question'
import { assertNever } from '@/lib/utils/types'

import { RichTextRendererStatic } from './rich-text-renderer-static'

type Attempt13RendererProps = {
  question: Question
}

const renderMultipleChoiceInput = (
  partId: string,
  answerMechanism: MultipleChoiceAnswerMechanism,
) => {
  return (
    <RadioGroup className="space-y-2">
      {answerMechanism.choices.map((choice, index) => {
        const inputId = `a13-${partId}-${choice.id}`

        return (
          <Label
            className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/80 bg-card px-3 py-2.5 text-card-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
            htmlFor={inputId}
            key={choice.id}
          >
            <RadioGroupItem className="mt-0.5" id={inputId} value={choice.id} />
            <span className="text-sm leading-6">
              <span className="mr-2 inline-block min-w-5 font-medium text-primary">
                {index + 1}.
              </span>
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
      <Button className="rounded-xl" type="button" variant="outline">
        I got this step right
      </Button>
      <Button className="rounded-xl" type="button" variant="secondary">
        I need to revisit it
      </Button>
    </div>
  )
}

const renderFreeTextInput = () => {
  return (
    <Textarea
      className="min-h-28 rounded-xl border-border/80 bg-background text-sm"
      placeholder="Write your answer for this step"
    />
  )
}

const renderPartInput = (part: QuestionPart) => {
  const { answerMechanism } = part

  switch (answerMechanism.type) {
    case 'multipleChoice':
      return renderMultipleChoiceInput(part.id, answerMechanism)
    case 'selfReport':
      return renderSelfReportInput()
    case 'freeTextValidation':
      return renderFreeTextInput()
    default:
      return assertNever(answerMechanism)
  }
}

export const Attempt13Renderer = ({ question }: Attempt13RendererProps) => {
  const totalParts = question.parts.length

  return (
    <section className="w-full rounded-3xl border border-border/70 bg-background/90 p-4 shadow-xl backdrop-blur sm:p-8">
      <Card className="mb-7 overflow-hidden border-border/70 bg-gradient-to-r from-primary/10 via-card to-accent/10 py-0">
        <CardHeader>
          <Badge className="w-fit" variant="outline">
            Attempt 13
          </Badge>
          <CardTitle className="text-2xl sm:text-3xl">Step Timeline</CardTitle>
          <CardDescription>
            Question #{question.id} laid out as {totalParts} guided{' '}
            {totalParts === 1 ? 'step' : 'steps'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-6">
          <RichTextRendererStatic
            className="text-base leading-7 text-foreground"
            data={question.richText}
          />
        </CardContent>
      </Card>

      <div className="relative space-y-4 pl-8 sm:pl-10">
        <span className="pointer-events-none absolute top-3 bottom-3 left-3 w-px bg-gradient-to-b from-primary/60 via-border to-border sm:left-4" />

        {question.parts.map((part, index) => {
          return (
            <article className="relative" key={part.id}>
              <span className="absolute top-7 -left-8 inline-flex size-6 items-center justify-center rounded-full border border-primary/30 bg-background text-xs font-semibold text-primary sm:-left-9 sm:size-7">
                {index + 1}
              </span>

              <Card className="border-border/80 bg-card py-0">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">Part {index + 1}</CardTitle>
                    <Badge variant="secondary">Step</Badge>
                  </div>
                  <CardDescription>
                    Work through this part before moving down the timeline.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5 pb-6">
                  {part.richText ? (
                    <RichTextRendererStatic
                      className="text-sm leading-7 text-foreground"
                      data={part.richText}
                    />
                  ) : null}
                  {renderPartInput(part)}
                </CardContent>
              </Card>
            </article>
          )
        })}
      </div>
    </section>
  )
}
