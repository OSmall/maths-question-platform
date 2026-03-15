import { assertNever } from '@/lib/utils/types'
import type { MultipleChoiceAnswerMechanism, Question, QuestionPart } from '@/lib/domain/question'

import { RichTextRendererStatic } from './rich-text-renderer-static'

type Attempt2RendererProps = {
  question: Question
}

const renderMultipleChoice = (partId: string, answerMechanism: MultipleChoiceAnswerMechanism) => {
  return (
    <fieldset className="space-y-3">
      <legend className="mb-2 text-xs tracking-[0.2em] text-stone-500 uppercase">Select one</legend>
      {answerMechanism.choices.map((choice, index) => {
        const inputId = `a2-${partId}-${choice.id}`

        return (
          <label
            className="flex items-start gap-4 rounded-lg px-2 py-1"
            htmlFor={inputId}
            key={choice.id}
          >
            <input
              className="mt-1 size-4 accent-stone-700"
              id={inputId}
              name={partId}
              type="radio"
            />
            <span className="text-base leading-7 text-stone-800">
              {String.fromCharCode(65 + index)}. {choice.text}
            </span>
          </label>
        )
      })}
    </fieldset>
  )
}

const renderSelfReport = () => {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <button
        className="rounded-md border border-stone-300 bg-stone-100 px-4 py-2 text-sm text-stone-900 transition-colors hover:bg-stone-200"
        type="button"
      >
        Mark as correct
      </button>
      <button
        className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm text-stone-900 transition-colors hover:bg-stone-100"
        type="button"
      >
        Mark as incorrect
      </button>
    </div>
  )
}

const renderFreeText = () => {
  return (
    <textarea
      className="min-h-28 w-full rounded-md border border-stone-300 bg-white px-4 py-3 text-base leading-7 text-stone-900 outline-none focus:border-stone-500"
      placeholder="Write your reasoning"
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

export const Attempt2Renderer = ({ question }: Attempt2RendererProps) => {
  return (
    <section
      className="w-full max-w-4xl rounded-sm border border-stone-300 bg-[#f8f2e7] px-5 py-8 shadow-lg sm:px-10"
      style={{ fontFamily: 'Charter, Cambria, Georgia, serif' }}
    >
      <header className="mb-7 border-b border-stone-300 pb-5">
        <p className="text-xs tracking-[0.25em] text-stone-500 uppercase">Attempt two</p>
        <h1 className="mt-2 text-3xl leading-tight text-stone-900 sm:text-4xl">
          Editorial exam sheet
        </h1>
        <p className="mt-2 text-sm text-stone-600">Question #{question.id}</p>
      </header>

      <article className="mb-8 border-b border-dashed border-stone-300 pb-7">
        <h2 className="mb-4 text-sm tracking-[0.2em] text-stone-500 uppercase">Question</h2>
        <RichTextRendererStatic
          className="text-lg leading-8 text-stone-900"
          data={question.richText}
        />
      </article>

      <div className="space-y-8">
        {question.parts.map((part, index) => {
          return (
            <section className="border-b border-dashed border-stone-300 pb-7" key={part.id}>
              <div className="mb-4 flex items-baseline gap-3">
                <span className="text-xs tracking-[0.2em] text-stone-500 uppercase">
                  Part {index + 1}
                </span>
                <span className="h-px flex-1 bg-stone-300" />
              </div>

              {part.richText ? (
                <RichTextRendererStatic
                  className="mb-5 text-base leading-8 text-stone-800"
                  data={part.richText}
                />
              ) : null}

              {renderPartInput(part)}
            </section>
          )
        })}
      </div>
    </section>
  )
}
