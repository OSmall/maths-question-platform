import { assertNever } from '@/lib/utils/types'
import { MultipleChoiceAnswerMechanism, Question, QuestionPart } from '@/lib/domain/question'

import { RichTextRendererStatic } from './rich-text-renderer-static'

type Attempt5RendererProps = {
  question: Question
}

const renderMultipleChoice = (partId: string, answerMechanism: MultipleChoiceAnswerMechanism) => {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-xs font-semibold tracking-[0.14em] text-zinc-500 uppercase">
        Answer
      </legend>
      {answerMechanism.choices.map((choice) => {
        const inputId = `a5-${partId}-${choice.id}`

        return (
          <label
            className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 transition-colors hover:border-zinc-400"
            htmlFor={inputId}
            key={choice.id}
          >
            <input
              className="mt-1 size-4 accent-zinc-800"
              id={inputId}
              name={partId}
              type="radio"
            />
            <span className="text-sm leading-6 text-zinc-800">{choice.text}</span>
          </label>
        )
      })}
    </fieldset>
  )
}

const renderSelfReport = () => {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <button
        className="rounded-xl border border-zinc-300 bg-zinc-100 px-4 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200"
        type="button"
      >
        Correct
      </button>
      <button
        className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100"
        type="button"
      >
        Incorrect
      </button>
    </div>
  )
}

const renderFreeText = () => {
  return (
    <textarea
      className="min-h-28 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm leading-7 text-zinc-900 outline-none focus:border-zinc-500"
      placeholder="Show your final answer"
    />
  )
}

const renderPartInput = (part: QuestionPart) => {
  const answerMechanism = part.answerMechanism

  if (!answerMechanism) {
    return null
  }

  switch (answerMechanism.type) {
    case 'multipleChoice':
      return renderMultipleChoice(part.id, answerMechanism)
    case 'selfReport':
      return renderSelfReport()
    case 'freeTextValidation':
      return renderFreeText()
    default:
      assertNever(answerMechanism)
  }
}

export const Attempt5Renderer = ({ question }: Attempt5RendererProps) => {
  const totalParts = question.parts.length

  return (
    <section className="w-full max-w-4xl rounded-3xl border border-zinc-200 bg-zinc-50 p-5 shadow-lg sm:p-8">
      <header className="mb-7 space-y-3">
        <p className="text-xs font-semibold tracking-[0.2em] text-zinc-500 uppercase">
          Attempt five
        </p>
        <h1 className="text-2xl font-semibold text-zinc-900 sm:text-3xl">Minimal focus mode</h1>
        <p className="text-sm text-zinc-600">
          Question #{question.id} with {totalParts} {totalParts === 1 ? 'part' : 'parts'}
        </p>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200">
          <div className="h-full w-full rounded-full bg-zinc-700" />
        </div>
      </header>

      <article className="mb-8 rounded-2xl border border-zinc-200 bg-white p-5">
        <RichTextRendererStatic
          className="text-base leading-7 text-zinc-900"
          data={question.richText}
        />
      </article>

      <div className="relative space-y-5 border-l-2 border-zinc-200 pl-6">
        {question.parts.map((part, index) => {
          return (
            <article
              className="relative rounded-2xl border border-zinc-200 bg-white p-5"
              key={part.id}
            >
              <span className="absolute top-6 -left-9 inline-flex size-5 items-center justify-center rounded-full border border-zinc-300 bg-zinc-50 text-[10px] font-semibold text-zinc-700">
                {index + 1}
              </span>

              <h2 className="mb-3 text-base font-semibold text-zinc-900">Part {index + 1}</h2>

              {part.richText ? (
                <RichTextRendererStatic
                  className="mb-5 text-sm leading-7 text-zinc-800"
                  data={part.richText}
                />
              ) : null}

              {renderPartInput(part)}
            </article>
          )
        })}
      </div>
    </section>
  )
}
