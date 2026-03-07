import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { MultipleChoiceAnswerMechanism, Question, QuestionPart } from '@/lib/domain/question'
import { assertNever } from '@/lib/utils/types'

import { RichTextRendererStatic } from './rich-text-renderer-static'

type Attempt10RendererProps = {
  question: Question
}

const renderMultipleChoice = (partId: string, answerMechanism: MultipleChoiceAnswerMechanism) => {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold tracking-[0.14em] text-zinc-500 uppercase dark:text-zinc-300">
        Answer
      </p>

      <RadioGroup className="gap-2">
        {answerMechanism.choices.map((choice, index) => {
          const inputId = `a10-${partId}-${choice.id}`

          return (
            <Card
              className="rounded-xl border-zinc-200 bg-white py-0 shadow-none transition-colors hover:border-zinc-400 dark:border-zinc-600 dark:bg-slate-900/95 dark:hover:border-zinc-500"
              key={choice.id}
              size="sm"
            >
              <CardContent className="px-3 py-2.5">
                <div className="flex items-start gap-3">
                  <RadioGroupItem id={inputId} value={choice.id} />
                  <Label
                    className="text-sm leading-6 text-zinc-800 dark:text-zinc-100"
                    htmlFor={inputId}
                  >
                    {String.fromCharCode(65 + index)}. {choice.text}
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
    <div className="grid gap-2 sm:grid-cols-2">
      <Button
        className="rounded-xl border-zinc-300 bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
        type="button"
        variant="outline"
      >
        Correct
      </Button>
      <Button
        className="rounded-xl border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-slate-900 dark:text-zinc-100 dark:hover:bg-slate-800"
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
      className="min-h-28 rounded-xl border-zinc-300 bg-white text-sm leading-7 text-zinc-900 placeholder:text-zinc-500 focus-visible:border-zinc-500 dark:border-zinc-600 dark:bg-slate-900 dark:text-zinc-100 dark:placeholder:text-zinc-400"
      placeholder="Show your final answer"
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

export const Attempt10Renderer = ({ question }: Attempt10RendererProps) => {
  const totalParts = question.parts.length

  return (
    <section className="w-full max-w-4xl rounded-3xl border border-zinc-200 bg-zinc-50 p-5 shadow-lg dark:border-zinc-700 dark:bg-slate-950/80 sm:p-8">
      <header className="mb-7 space-y-3">
        <Badge
          className="w-fit border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-500 dark:bg-zinc-800 dark:text-zinc-100"
          variant="outline"
        >
          Attempt ten
        </Badge>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 sm:text-3xl">
          Minimal focus mode
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Question #{question.id} with {totalParts} {totalParts === 1 ? 'part' : 'parts'}
        </p>
        <Progress
          className="w-full [&_[data-slot=progress-indicator]]:bg-zinc-700 dark:[&_[data-slot=progress-indicator]]:bg-zinc-300"
          value={100}
        />
      </header>

      <Card className="mb-8 rounded-2xl border-zinc-200 bg-white py-0 dark:border-zinc-700 dark:bg-slate-900/90">
        <CardContent className="py-5">
          <RichTextRendererStatic
            className="text-base leading-7 text-zinc-900 dark:text-zinc-100"
            data={question.richText}
          />
        </CardContent>
      </Card>

      <div className="relative space-y-5 border-l-2 border-zinc-200 pl-6 dark:border-zinc-700">
        {question.parts.map((part, index) => {
          return (
            <Card
              className="relative rounded-2xl border-zinc-200 bg-white py-0 dark:border-zinc-700 dark:bg-slate-900/90"
              key={part.id}
            >
              <span className="absolute top-6 -left-9 inline-flex size-5 items-center justify-center rounded-full border border-zinc-300 bg-zinc-50 text-[10px] font-semibold text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100">
                {index + 1}
              </span>

              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Part {index + 1}
                </CardTitle>
                <Separator className="bg-zinc-200 dark:bg-zinc-700" />
              </CardHeader>

              <CardContent className="space-y-5 pb-6">
                {part.richText ? (
                  <RichTextRendererStatic
                    className="text-sm leading-7 text-zinc-800 dark:text-zinc-200"
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
