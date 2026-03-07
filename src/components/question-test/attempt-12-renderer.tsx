import type { MultipleChoiceAnswerMechanism, Question, QuestionPart } from '@/lib/domain/question'
import { assertNever } from '@/lib/utils/types'

import { RichTextRendererStatic } from './rich-text-renderer-static'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'

type Attempt12RendererProps = {
  question: Question
}

const renderMultipleChoiceInput = (
  partId: string,
  answerMechanism: MultipleChoiceAnswerMechanism,
) => {
  return (
    <fieldset className="space-y-3">
      <legend className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
        Select one answer
      </legend>
      <RadioGroup className="gap-2">
        {answerMechanism.choices.map((choice, index) => {
          const inputId = `exam-${partId}-${choice.id}`

          return (
            <Label
              className="ring-border/80 bg-input/20 hover:bg-input/40 flex w-full cursor-pointer items-start gap-3 rounded-lg p-3 ring-1 transition-colors"
              htmlFor={inputId}
              key={choice.id}
            >
              <RadioGroupItem id={inputId} value={choice.id} />
              <span className="text-sm leading-6 text-foreground">
                <span className="mr-1.5 font-semibold text-muted-foreground">
                  {String.fromCharCode(65 + index)}.
                </span>
                {choice.text}
              </span>
            </Label>
          )
        })}
      </RadioGroup>
    </fieldset>
  )
}

const renderSelfReportInput = () => {
  return (
    <fieldset className="space-y-3">
      <legend className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
        Mark result
      </legend>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button className="rounded-lg" type="button" variant="outline">
          I got this right
        </Button>
        <Button className="rounded-lg" type="button" variant="secondary">
          I need to review
        </Button>
      </div>
    </fieldset>
  )
}

const renderFreeTextInput = () => {
  return (
    <fieldset className="space-y-3">
      <legend className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
        Write your answer
      </legend>
      <Textarea
        className="min-h-28 rounded-lg bg-input/20 leading-7"
        placeholder="Show working and final answer"
      />
    </fieldset>
  )
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

export const Attempt12Renderer = ({ question }: Attempt12RendererProps) => {
  const totalParts = question.parts.length

  return (
    <section className="w-full max-w-4xl">
      <Card className="ring-border/70 bg-card/90 relative overflow-hidden rounded-none border-0 py-0 shadow-sm ring-1">
        <div className="bg-input/40 pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent_35px,rgba(127,127,127,0.12)_36px)] bg-[size:100%_36px]" />

        <CardHeader className="relative border-b border-border/70 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge variant="outline">Exam Desk</Badge>
            <Badge variant="secondary">Question #{question.id}</Badge>
          </div>
          <CardTitle className="font-serif text-2xl tracking-wide">
            Mathematics Examination Paper
          </CardTitle>
          <CardDescription>
            Read each section carefully. Total sections: {totalParts}. Show all reasoning where
            required.
          </CardDescription>
        </CardHeader>

        <CardContent className="relative space-y-6 py-6">
          <article className="bg-background/85 ring-border/80 rounded-xl p-5 ring-1">
            <p className="mb-2 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              Question prompt
            </p>
            <RichTextRendererStatic
              className="font-serif text-base leading-8 text-foreground"
              data={question.richText}
            />
          </article>

          <div className="space-y-4">
            {question.parts.map((part, index) => {
              return (
                <article
                  className="bg-background/90 ring-border/80 rounded-xl p-5 ring-1"
                  key={part.id}
                >
                  <header className="mb-4 flex items-start justify-between gap-3 border-b border-dashed border-border/80 pb-3">
                    <div>
                      <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                        Section {index + 1}
                      </p>
                      <h3 className="font-serif text-lg leading-7 text-foreground">Answer area</h3>
                    </div>
                    <Badge variant="outline">Part {index + 1}</Badge>
                  </header>

                  <div className="space-y-5">
                    <RichTextRendererStatic
                      className="font-serif text-[15px] leading-7 text-foreground"
                      data={part.richText}
                    />
                    {renderPartInput(part)}
                  </div>
                </article>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
