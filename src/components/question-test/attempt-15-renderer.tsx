import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import type { MultipleChoiceAnswerMechanism, Question, QuestionPart } from '@/lib/domain/question'
import { assertNever } from '@/lib/utils/types'

import { RichTextRendererStatic } from './rich-text-renderer-static'

type Attempt15RendererProps = {
  question: Question
}

const renderMultipleChoice = (partId: string, answerMechanism: MultipleChoiceAnswerMechanism) => {
  return (
    <RadioGroup className="grid gap-2">
      {answerMechanism.choices.map((choice, index) => {
        const inputId = `a15-${partId}-${choice.id}`

        return (
          <Card
            className="rounded-xl border-border bg-card py-0 shadow-none transition-colors hover:border-primary/50"
            key={choice.id}
          >
            <CardContent className="px-3 py-2.5">
              <div className="flex items-start gap-3">
                <RadioGroupItem id={inputId} value={choice.id} />
                <Label
                  className="flex cursor-pointer items-start gap-2 text-sm leading-6 text-card-foreground"
                  htmlFor={inputId}
                >
                  <span className="inline-flex min-w-5 justify-center rounded bg-muted px-1.5 py-0.5 text-xs font-semibold text-muted-foreground">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span>{choice.text}</span>
                </Label>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </RadioGroup>
  )
}

const renderSelfReport = () => {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <Button className="rounded-xl" type="button" variant="default">
        Nailed it
      </Button>
      <Button className="rounded-xl" type="button" variant="secondary">
        One more pass
      </Button>
    </div>
  )
}

const renderFreeText = () => {
  return (
    <Textarea
      className="min-h-24 rounded-xl border-border bg-background text-sm leading-6"
      placeholder="Type your final answer"
    />
  )
}

const renderPartInput = (part: QuestionPart) => {
  switch (part.answerMechanism.type) {
    case 'multipleChoice':
      return renderMultipleChoice(part.id, part.answerMechanism)
    case 'selfReport':
      return renderSelfReport()
    case 'freeTextValidation':
      return renderFreeText()
    default:
      return assertNever(part.answerMechanism)
  }
}

const getMechanismLabel = (part: QuestionPart) => {
  switch (part.answerMechanism.type) {
    case 'multipleChoice':
      return 'Pick one'
    case 'selfReport':
      return 'Self check'
    case 'freeTextValidation':
      return 'Free response'
    default:
      return assertNever(part.answerMechanism)
  }
}

export const Attempt15Renderer = ({ question }: Attempt15RendererProps) => {
  const totalParts = question.parts.length

  return (
    <section className="w-full max-w-3xl space-y-4">
      <Card className="overflow-hidden border-border bg-card py-0 shadow-sm">
        <CardContent className="space-y-3 bg-gradient-to-r from-primary/15 via-secondary/10 to-accent/15 px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-primary/30 bg-primary/10 text-primary" variant="outline">
              Practice Sprint
            </Badge>
            <Badge className="border-border bg-background/80 text-foreground" variant="outline">
              Question #{question.id}
            </Badge>
            <Badge className="border-border bg-background/80 text-foreground" variant="outline">
              {totalParts} {totalParts === 1 ? 'part' : 'parts'}
            </Badge>
          </div>

          <CardTitle className="text-xl tracking-tight text-foreground sm:text-2xl">
            Fast flow. Clear checks. Keep momentum.
          </CardTitle>
        </CardContent>
      </Card>

      <Card className="border-border bg-card py-0 shadow-sm">
        <CardHeader className="pb-2">
          <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Question prompt
          </p>
        </CardHeader>
        <CardContent className="pb-4">
          <RichTextRendererStatic
            className="text-base leading-7 text-card-foreground"
            data={question.richText}
          />
        </CardContent>
      </Card>

      <div className="space-y-3">
        {question.parts.map((part, index) => {
          const partIndex = index + 1

          return (
            <Card className="border-border bg-card py-0 shadow-sm" key={part.id}>
              <CardHeader className="space-y-2 pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      className="rounded-md border-border bg-muted text-muted-foreground"
                      variant="outline"
                    >
                      P{partIndex}
                    </Badge>
                    <CardTitle className="text-base text-card-foreground">
                      Part {partIndex}
                    </CardTitle>
                  </div>
                  <Badge
                    className="rounded-md border-border bg-background text-foreground"
                    variant="outline"
                  >
                    {getMechanismLabel(part)}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pb-4">
                <RichTextRendererStatic
                  className="text-sm leading-7 text-card-foreground"
                  data={part.richText}
                />
                {renderPartInput(part)}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
