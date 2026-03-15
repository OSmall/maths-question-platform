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

type Attempt9RendererProps = {
  question: Question
}

const renderMultipleChoice = (partId: string, answerMechanism: MultipleChoiceAnswerMechanism) => {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold tracking-[0.2em] text-cyan-300 uppercase">
        Multiple choice
      </p>

      <RadioGroup className="gap-3">
        {answerMechanism.choices.map((choice) => {
          const inputId = `a9-${partId}-${choice.id}`

          return (
            <Card
              className="rounded-xl border-cyan-500/30 bg-slate-900/70 py-0 shadow-none transition-colors hover:border-cyan-400/70"
              key={choice.id}
              size="sm"
            >
              <CardContent className="px-3 py-2.5">
                <div className="flex items-start gap-3">
                  <RadioGroupItem
                    className="border-cyan-300 data-checked:border-cyan-300 data-checked:bg-cyan-300"
                    id={inputId}
                    value={choice.id}
                  />
                  <Label className="text-sm leading-6 text-slate-100" htmlFor={inputId}>
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
        className="rounded-xl border-cyan-400/70 bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25"
        type="button"
        variant="outline"
      >
        Solved correctly
      </Button>
      <Button
        className="rounded-xl border-orange-400/70 bg-orange-500/15 text-orange-100 hover:bg-orange-500/25"
        type="button"
        variant="outline"
      >
        Needs review
      </Button>
    </div>
  )
}

const renderFreeText = () => {
  return (
    <Textarea
      className="min-h-28 rounded-xl border-cyan-500/40 bg-slate-900/80 text-sm leading-7 text-slate-100 placeholder:text-slate-400 focus-visible:border-cyan-300"
      placeholder="Type your working"
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

export const Attempt9Renderer = ({ question }: Attempt9RendererProps) => {
  return (
    <section className="w-full max-w-5xl rounded-[2rem] border border-cyan-400/40 bg-slate-950/90 p-5 text-slate-100 shadow-[0_0_80px_rgba(8,145,178,0.2)] sm:p-8">
      <Card className="mb-7 rounded-2xl border-cyan-500/30 bg-slate-900/80 py-0 text-slate-100">
        <CardHeader className="space-y-3">
          <Badge
            className="w-fit border-cyan-500/40 bg-cyan-500/15 text-cyan-200 dark:border-cyan-500/40 dark:bg-cyan-500/15 dark:text-cyan-200"
            variant="outline"
          >
            Attempt nine
          </Badge>
          <CardTitle className="text-2xl font-semibold text-white sm:text-3xl">
            High contrast lab mode
          </CardTitle>
          <p className="text-sm text-cyan-100/80">Question #{question.id}</p>
        </CardHeader>
      </Card>

      <Card className="mb-6 rounded-2xl border-cyan-500/30 bg-slate-900/70 py-0 text-slate-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold tracking-[0.16em] text-cyan-300 uppercase">
            Question prompt
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <RichTextRendererStatic
            className="text-base leading-7 text-slate-100 [&_a]:text-cyan-300 [&_a]:underline"
            data={question.richText}
          />
        </CardContent>
      </Card>

      <div className="space-y-4">
        {question.parts.map((part, index) => {
          return (
            <Card
              className="rounded-2xl border-cyan-500/30 bg-slate-900/70 py-0 text-slate-100"
              key={part.id}
              style={{ contentVisibility: 'auto', containIntrinsicSize: '320px' }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-base font-semibold text-white">
                    Part {index + 1}
                  </CardTitle>
                  <Badge
                    className="border-cyan-500/40 bg-cyan-500/15 px-2.5 py-1 text-cyan-200 uppercase dark:border-cyan-500/40 dark:bg-cyan-500/15 dark:text-cyan-200"
                    variant="outline"
                  >
                    Task
                  </Badge>
                </div>
                <Separator className="bg-cyan-500/35" />
              </CardHeader>

              <CardContent className="space-y-5 pb-6">
                {part.richText ? (
                  <RichTextRendererStatic
                    className="text-sm leading-7 text-slate-200 [&_a]:text-cyan-300 [&_a]:underline"
                    data={part.richText}
                  />
                ) : null}

                {renderPartInput(part)}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
