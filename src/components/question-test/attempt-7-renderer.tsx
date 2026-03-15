import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import type { MultipleChoiceAnswerMechanism, Question, QuestionPart } from '@/lib/domain/question'
import { assertNever } from '@/lib/utils/types'

import { RichTextRendererStatic } from './rich-text-renderer-static'

type Attempt7RendererProps = {
  question: Question
}

const renderMultipleChoice = (partId: string, answerMechanism: MultipleChoiceAnswerMechanism) => {
  return (
    <div className="space-y-3">
      <p className="text-xs tracking-[0.2em] text-stone-500 uppercase dark:text-stone-300">
        Select one
      </p>
      <RadioGroup className="gap-3">
        {answerMechanism.choices.map((choice, index) => {
          const inputId = `a7-${partId}-${choice.id}`

          return (
            <Card
              className="rounded-lg border-stone-300 bg-transparent py-0 shadow-none"
              key={choice.id}
              size="sm"
            >
              <CardContent className="px-3 py-2">
                <div className="flex items-start gap-3">
                  <RadioGroupItem id={inputId} value={choice.id} />
                  <Label
                    className="text-base leading-7 text-stone-800 dark:text-stone-100"
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
    <div className="grid gap-3 sm:grid-cols-2">
      <Button
        className="rounded-md border-stone-300 bg-stone-100 text-stone-900 hover:bg-stone-200 dark:border-stone-500 dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-stone-700"
        type="button"
        variant="outline"
      >
        Mark as correct
      </Button>
      <Button
        className="rounded-md border-stone-300 bg-white text-stone-900 hover:bg-stone-100 dark:border-stone-500 dark:bg-slate-900 dark:text-stone-100 dark:hover:bg-slate-800"
        type="button"
        variant="outline"
      >
        Mark as incorrect
      </Button>
    </div>
  )
}

const renderFreeText = () => {
  return (
    <Textarea
      className="min-h-28 rounded-md border-stone-300 bg-white text-base leading-7 text-stone-900 placeholder:text-stone-500 focus-visible:border-stone-500 dark:border-stone-500 dark:bg-slate-900 dark:text-stone-100 dark:placeholder:text-stone-400"
      placeholder="Write your reasoning"
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

export const Attempt7Renderer = ({ question }: Attempt7RendererProps) => {
  return (
    <Card
      className="w-full max-w-4xl rounded-sm border-stone-300 bg-[#f8f2e7] py-0 shadow-lg dark:border-stone-600 dark:bg-[#1e1a15]"
      style={{ fontFamily: 'Charter, Cambria, Georgia, serif' }}
    >
      <CardHeader className="mb-7 border-b border-stone-300 pb-5 dark:border-stone-600">
        <Badge
          className="w-fit rounded-sm border-stone-300 bg-stone-100 text-stone-700 uppercase dark:border-stone-500 dark:bg-stone-800 dark:text-stone-200"
          variant="outline"
        >
          Attempt seven
        </Badge>
        <CardTitle className="mt-2 text-3xl leading-tight text-stone-900 dark:text-stone-100 sm:text-4xl">
          Editorial exam sheet
        </CardTitle>
        <p className="text-sm text-stone-600 dark:text-stone-300">Question #{question.id}</p>
      </CardHeader>

      <CardContent className="space-y-8 pb-8">
        <section className="border-b border-dashed border-stone-300 pb-7 dark:border-stone-600">
          <p className="mb-4 text-sm tracking-[0.2em] text-stone-500 uppercase dark:text-stone-300">
            Question
          </p>
          <RichTextRendererStatic
            className="text-lg leading-8 text-stone-900 dark:text-stone-100"
            data={question.richText}
          />
        </section>

        <div className="space-y-8">
          {question.parts.map((part, index) => {
            return (
              <section
                className="border-b border-dashed border-stone-300 pb-7 dark:border-stone-600"
                key={part.id}
              >
                <div className="mb-4 flex items-baseline gap-3">
                  <span className="text-xs tracking-[0.2em] text-stone-500 uppercase dark:text-stone-300">
                    Part {index + 1}
                  </span>
                  <span className="h-px flex-1 bg-stone-300 dark:bg-stone-600" />
                </div>

                {part.richText ? (
                  <RichTextRendererStatic
                    className="mb-5 text-base leading-8 text-stone-800 dark:text-stone-200"
                    data={part.richText}
                  />
                ) : null}

                {renderPartInput(part)}
              </section>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
