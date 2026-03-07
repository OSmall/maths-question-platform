import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { MultipleChoiceAnswerMechanism, Question, QuestionPart } from '@/lib/domain/question'
import { assertNever } from '@/lib/utils/types'

import { RichTextRendererStatic } from './rich-text-renderer-static'

type Attempt6RendererProps = {
  question: Question
}

const renderMultipleChoice = (partId: string, answerMechanism: MultipleChoiceAnswerMechanism) => {
  return (
    <div className="grid gap-3">
      <p className="text-xs font-semibold tracking-[0.18em] text-sky-700 uppercase dark:text-sky-300">
        Choose one answer
      </p>

      <RadioGroup className="gap-3">
        {answerMechanism.choices.map((choice) => {
          const inputId = `a6-${partId}-${choice.id}`

          return (
            <Card
              className="rounded-2xl border-sky-100 bg-white/95 py-0 shadow-none transition-colors hover:border-sky-300 hover:bg-sky-50/70 dark:border-sky-500/35 dark:bg-slate-900/85 dark:hover:border-sky-400/60 dark:hover:bg-sky-950/20"
              key={choice.id}
              size="sm"
            >
              <CardContent className="px-4 py-3">
                <div className="flex items-start gap-3">
                  <RadioGroupItem id={inputId} value={choice.id} />
                  <Label className="leading-6 text-slate-700 dark:text-slate-100" htmlFor={inputId}>
                    {choice.text}
                  </Label>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </RadioGroup>
    </div>
  )
}

const renderSelfReport = () => {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Button
        className="rounded-2xl border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-400/40 dark:bg-emerald-500/20 dark:text-emerald-100 dark:hover:bg-emerald-500/30"
        type="button"
        variant="outline"
      >
        I got this right
      </Button>
      <Button
        className="rounded-2xl border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100 dark:border-rose-400/40 dark:bg-rose-500/20 dark:text-rose-100 dark:hover:bg-rose-500/30"
        type="button"
        variant="outline"
      >
        I got this wrong
      </Button>
    </div>
  )
}

const renderFreeText = () => {
  return (
    <Textarea
      className="min-h-28 rounded-2xl border-sky-200 bg-white text-slate-800 placeholder:text-slate-500 focus-visible:border-sky-500 dark:border-sky-500/45 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus-visible:border-sky-300"
      placeholder="Write your answer here"
    />
  )
}

const renderPartInput = (part: QuestionPart) => {
  if (!part.answerMechanism) {
    return null
  }

  switch (part.answerMechanism.type) {
    case 'multipleChoice':
      return renderMultipleChoice(part.id, part.answerMechanism)
    case 'selfReport':
      return renderSelfReport()
    case 'freeTextValidation':
      return renderFreeText()
    default:
      assertNever(part.answerMechanism)
  }
}

export const Attempt6Renderer = ({ question }: Attempt6RendererProps) => {
  return (
    <section className="relative w-full max-w-5xl overflow-hidden rounded-[2rem] border border-sky-200/70 bg-white/90 p-5 shadow-2xl backdrop-blur dark:border-sky-500/30 dark:bg-slate-950/80 sm:p-8 lg:p-10">
      <div className="pointer-events-none absolute -top-28 -left-20 size-72 rounded-full bg-sky-300/30 blur-3xl dark:bg-sky-500/20" />
      <div className="pointer-events-none absolute -right-32 -bottom-36 size-80 rounded-full bg-cyan-200/40 blur-3xl dark:bg-cyan-500/20" />

      <div className="relative space-y-7">
        <header className="space-y-3">
          <Badge
            className="rounded-4xl border-sky-200 bg-sky-100 text-sky-800 dark:border-sky-400/50 dark:bg-sky-500/20 dark:text-sky-100"
            variant="outline"
          >
            Practice view
          </Badge>
          <h1 className="text-2xl leading-tight font-semibold text-slate-900 dark:text-slate-100 sm:text-3xl">
            Work through the question step by step
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">Question #{question.id}</p>
        </header>

        <Card className="rounded-3xl border-sky-100 bg-white/95 py-0 shadow-sm dark:border-sky-500/35 dark:bg-slate-900/90">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold tracking-[0.16em] text-sky-700 uppercase dark:text-sky-300">
              Question prompt
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            <RichTextRendererStatic
              className="text-base leading-7 text-slate-800 dark:text-slate-100"
              data={question.richText}
            />
          </CardContent>
        </Card>

        <div className="space-y-5">
          {question.parts.map((part, index) => {
            return (
              <Card
                className="rounded-3xl border-sky-100 bg-gradient-to-b from-white to-sky-50/60 py-0 shadow-sm dark:border-sky-500/30 dark:from-slate-900 dark:to-sky-950/25"
                key={part.id}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex size-9 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-800 dark:bg-sky-500/25 dark:text-sky-100">
                      {index + 1}
                    </span>
                    <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      Part {index + 1}
                    </CardTitle>
                  </div>
                  <Separator className="bg-sky-100 dark:bg-sky-500/30" />
                </CardHeader>

                <CardContent className="space-y-5 pb-6">
                  {part.richText ? (
                    <RichTextRendererStatic
                      className="text-sm leading-7 text-slate-700 dark:text-slate-200"
                      data={part.richText}
                    />
                  ) : null}

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
