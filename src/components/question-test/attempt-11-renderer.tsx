import { RichTextRendererStatic } from '@/components/question-test/rich-text-renderer-static'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import {
  type MultipleChoiceAnswerMechanism,
  type Question,
  type QuestionPart,
} from '@/lib/domain/question'
import { assertNever } from '@/lib/utils/types'

type Attempt11RendererProps = {
  question: Question
}

const renderMultipleChoiceInput = (
  partId: string,
  answerMechanism: MultipleChoiceAnswerMechanism,
) => {
  return (
    <RadioGroup className="gap-2.5">
      {answerMechanism.choices.map((choice, index) => {
        const inputId = `a11-${partId}-${choice.id}`

        return (
          <Label
            className="border-border/70 bg-card/70 hover:bg-card flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 transition-colors"
            htmlFor={inputId}
            key={choice.id}
          >
            <RadioGroupItem id={inputId} value={choice.id} />
            <span className="text-foreground text-sm leading-6">
              <span className="text-muted-foreground mr-1.5 font-medium">
                {String.fromCharCode(65 + index)}.
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
    <div className="grid gap-2.5 sm:grid-cols-2">
      <Button className="rounded-xl" type="button" variant="secondary">
        I solved this
      </Button>
      <Button className="rounded-xl" type="button" variant="outline">
        I need more practice
      </Button>
    </div>
  )
}

const renderFreeTextValidationInput = () => {
  return (
    <Textarea
      className="min-h-28 rounded-xl bg-background"
      placeholder="Write your working and final answer here..."
    />
  )
}

const renderAnswerInput = (part: QuestionPart) => {
  switch (part.answerMechanism.type) {
    case 'multipleChoice':
      return renderMultipleChoiceInput(part.id, part.answerMechanism)
    case 'selfReport':
      return renderSelfReportInput()
    case 'freeTextValidation':
      return renderFreeTextValidationInput()
    default:
      assertNever(part.answerMechanism)
  }
}

export const Attempt11Renderer = ({ question }: Attempt11RendererProps) => {
  return (
    <section className="w-full max-w-4xl space-y-5">
      <Card className="border-border/70 bg-background/95 relative overflow-hidden rounded-3xl border py-0 shadow-sm">
        <div className="from-amber-500/20 via-orange-400/5 to-transparent pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b" />
        <CardHeader className="space-y-3 pb-2">
          <Badge
            className="rounded-md border-amber-700/30 bg-amber-500/10 text-amber-800 dark:text-amber-200"
            variant="outline"
          >
            Notebook Tutor
          </Badge>
          <CardTitle className="text-foreground text-2xl font-semibold tracking-tight">
            Worksheet {question.id}
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Read carefully, then complete each section.
          </p>
        </CardHeader>

        <CardContent className="pb-6">
          <div className="border-border/70 bg-card rounded-2xl border border-dashed p-4 sm:p-5">
            <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-[0.12em] uppercase">
              Question
            </p>
            <RichTextRendererStatic
              className="text-foreground text-base leading-7"
              data={question.richText}
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {question.parts.map((part, index) => {
          return (
            <Card
              className="border-border/70 bg-background/95 rounded-2xl border py-0 shadow-sm"
              key={part.id}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="border-border bg-muted text-foreground inline-flex size-7 items-center justify-center rounded-full border text-xs font-semibold">
                    {index + 1}
                  </span>
                  <CardTitle className="text-foreground text-base font-semibold">
                    Section {index + 1}
                  </CardTitle>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pb-5">
                <div className="border-border/70 bg-card rounded-xl border border-dashed p-4">
                  <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-[0.12em] uppercase">
                    Prompt
                  </p>
                  <RichTextRendererStatic
                    className="text-foreground text-sm leading-7"
                    data={part.richText}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-muted-foreground text-xs font-semibold tracking-[0.12em] uppercase">
                    Your Answer
                  </p>
                  {renderAnswerInput(part)}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
