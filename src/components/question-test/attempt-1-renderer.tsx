import { assertNever } from '@/lib/utils/types'
import type { MultipleChoiceAnswerMechanism, Question, QuestionPart } from '@/lib/domain/question'

import { RichTextRendererStatic } from './rich-text-renderer-static'

type Attempt1RendererProps = {
  question: Question
}

const renderMultipleChoice = (partId: string, answerMechanism: MultipleChoiceAnswerMechanism) => {
  return (
    <fieldset className="grid gap-3">
      <legend className="mb-1 text-xs font-semibold tracking-[0.18em] text-sky-700 uppercase">
        Choose one answer
      </legend>
      {answerMechanism.choices.map((choice) => {
        const inputId = `a1-${partId}-${choice.id}`

        return (
          <label
            className="flex cursor-pointer items-start gap-3 rounded-2xl border border-sky-100 bg-white/90 px-4 py-3 transition-colors hover:border-sky-300 hover:bg-sky-50"
            htmlFor={inputId}
            key={choice.id}
          >
            <input className="mt-1 size-4 accent-sky-600" id={inputId} name={partId} type="radio" />
            <span className="text-sm leading-6 text-slate-700">{choice.text}</span>
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
        className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 transition-colors hover:bg-emerald-100"
        type="button"
      >
        I got this right
      </button>
      <button
        className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800 transition-colors hover:bg-rose-100"
        type="button"
      >
        I got this wrong
      </button>
    </div>
  )
}

const renderFreeText = () => {
  return (
    <textarea
      className="min-h-28 w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-sky-500"
      placeholder="Write your answer here"
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

export const Attempt1Renderer = ({ question }: Attempt1RendererProps) => {
  return (
    <section className="relative w-full max-w-5xl overflow-hidden rounded-[2rem] border border-sky-200/70 bg-white/85 p-5 shadow-2xl backdrop-blur sm:p-8 lg:p-10">
      <div className="pointer-events-none absolute -top-28 -left-20 size-72 rounded-full bg-sky-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 -bottom-36 size-80 rounded-full bg-cyan-200/40 blur-3xl" />

      <div className="relative space-y-7">
        <header className="space-y-3">
          <p className="text-xs font-semibold tracking-[0.2em] text-sky-700 uppercase">
            Practice view
          </p>
          <h1 className="text-2xl leading-tight font-semibold text-slate-900 sm:text-3xl">
            Work through the question step by step
          </h1>
          <p className="text-sm text-slate-600">Question #{question.id}</p>
        </header>

        <article className="rounded-3xl border border-sky-100 bg-white/90 p-5 shadow-sm sm:p-7">
          <h2 className="mb-4 text-sm font-semibold tracking-[0.16em] text-sky-700 uppercase">
            Question prompt
          </h2>
          <RichTextRendererStatic
            className="text-base leading-7 text-slate-800"
            data={question.richText}
          />
        </article>

        <div className="space-y-5">
          {question.parts.map((part, index) => {
            return (
              <article
                className="rounded-3xl border border-sky-100 bg-gradient-to-b from-white to-sky-50/50 p-5 shadow-sm sm:p-7"
                key={part.id}
              >
                <div className="mb-5 flex items-center gap-3">
                  <span className="inline-flex size-9 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-800">
                    {index + 1}
                  </span>
                  <h3 className="text-base font-semibold text-slate-900">Part {index + 1}</h3>
                </div>

                {part.richText ? (
                  <RichTextRendererStatic
                    className="mb-5 text-sm leading-7 text-slate-700"
                    data={part.richText}
                  />
                ) : null}

                {renderPartInput(part)}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
