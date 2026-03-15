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

type Attempt8RendererProps = {
  question: Question
}

const renderMultipleChoice = (partId: string, answerMechanism: MultipleChoiceAnswerMechanism) => {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold tracking-[0.14em] text-emerald-700 uppercase dark:text-emerald-300">
        Pick an option
      </p>

      <RadioGroup className="gap-2">
        {answerMechanism.choices.map((choice) => {
          const choiceId = `a8-${partId}-${choice.id}`

          return (
            <Card
              className="rounded-xl border-emerald-100 bg-white py-0 shadow-none transition-colors hover:border-emerald-300 dark:border-emerald-500/35 dark:bg-slate-900/85 dark:hover:border-emerald-400/60"
              key={choice.id}
              size="sm"
            >
              <CardContent className="px-3 py-2.5">
                <div className="flex items-start gap-3">
                  <RadioGroupItem id={choiceId} value={choice.id} />
                  <Label
                    className="text-sm leading-6 text-slate-700 dark:text-slate-100"
                    htmlFor={choiceId}
                  >
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
    <div className="flex flex-wrap gap-3">
      <Button
        className="rounded-full border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-400/40 dark:bg-emerald-500/20 dark:text-emerald-100 dark:hover:bg-emerald-500/30"
        type="button"
        variant="outline"
      >
        Correct
      </Button>
      <Button
        className="rounded-full border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-400/40 dark:bg-amber-500/20 dark:text-amber-100 dark:hover:bg-amber-500/30"
        type="button"
        variant="outline"
      >
        Incorrect
      </Button>
    </div>
  )
}

const renderFreeText = () => {
  return (
    <Textarea
      className="min-h-24 rounded-xl border-emerald-200 bg-white text-slate-800 placeholder:text-slate-500 focus-visible:border-emerald-500 dark:border-emerald-500/35 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus-visible:border-emerald-300"
      placeholder="Type your answer"
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

export const Attempt8Renderer = ({ question }: Attempt8RendererProps) => {
  return (
    <section className="w-full max-w-6xl rounded-[2rem] border border-emerald-100 bg-white/90 p-5 shadow-xl backdrop-blur-sm dark:border-emerald-500/30 dark:bg-slate-950/80 sm:p-8">
      <div className="grid gap-6 lg:grid-cols-12">
        <aside className="space-y-4 lg:sticky lg:top-8 lg:col-span-4 lg:self-start">
          <Card className="rounded-3xl border-emerald-100 bg-gradient-to-b from-emerald-50 to-white py-0 dark:border-emerald-500/30 dark:from-emerald-950/35 dark:to-slate-900">
            <CardContent className="space-y-2 py-5">
              <Badge
                className="w-fit border-emerald-300 bg-emerald-100 text-emerald-900 dark:border-emerald-400/60 dark:bg-emerald-500/20 dark:text-emerald-100"
                variant="outline"
              >
                Attempt eight
              </Badge>
              <CardTitle className="text-xl leading-tight font-semibold text-slate-900 dark:text-slate-100">
                Split study layout
              </CardTitle>
              <p className="text-sm text-slate-600 dark:text-slate-300">Question #{question.id}</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-emerald-100 bg-white py-0 dark:border-emerald-500/30 dark:bg-slate-900/95">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-300">
                Parts
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-5">
              <ul className="space-y-2">
                {question.parts.map((part, index) => {
                  return (
                    <li key={part.id}>
                      <a
                        className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm text-slate-700 transition-colors hover:bg-emerald-50 hover:text-emerald-800 dark:text-slate-200 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-100"
                        href={`#part-${part.id}`}
                      >
                        <span className="inline-flex size-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-800 dark:bg-emerald-500/25 dark:text-emerald-100">
                          {index + 1}
                        </span>
                        Part {index + 1}
                      </a>
                    </li>
                  )
                })}
              </ul>
            </CardContent>
          </Card>
        </aside>

        <div className="space-y-5 lg:col-span-8">
          <Card className="rounded-3xl border-emerald-100 bg-white py-0 shadow-sm dark:border-emerald-500/30 dark:bg-slate-900/95">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
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

          {question.parts.map((part, index) => {
            return (
              <Card
                className="rounded-3xl border-emerald-100 bg-white py-0 shadow-sm dark:border-emerald-500/30 dark:bg-slate-900/95"
                id={`part-${part.id}`}
                key={part.id}
                style={{ contentVisibility: 'auto', containIntrinsicSize: '360px' }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex size-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white dark:bg-emerald-500">
                      {index + 1}
                    </span>
                    <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      Part {index + 1}
                    </CardTitle>
                  </div>
                  <Separator className="bg-emerald-100 dark:bg-emerald-500/30" />
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
