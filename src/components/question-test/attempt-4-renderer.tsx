import { assertNever } from '@/lib/utils/types'
import { MultipleChoiceAnswerMechanism, Question, QuestionPart } from '@/lib/domain/question'

import { RichTextRendererStatic } from './rich-text-renderer-static'

type Attempt4RendererProps = {
  question: Question
}

const renderMultipleChoice = (partId: string, answerMechanism: MultipleChoiceAnswerMechanism) => {
  return (
    <fieldset className="space-y-3">
      <legend className="mb-2 text-xs font-semibold tracking-[0.2em] text-cyan-300 uppercase">
        Multiple choice
      </legend>
      {answerMechanism.choices.map((choice) => {
        const inputId = `a4-${partId}-${choice.id}`

        return (
          <label
            className="flex items-start gap-3 rounded-xl border border-cyan-500/30 bg-slate-900/70 px-3 py-2.5 transition-colors hover:border-cyan-400/70"
            htmlFor={inputId}
            key={choice.id}
          >
            <input
              className="mt-1 size-4 accent-cyan-400"
              id={inputId}
              name={partId}
              type="radio"
            />
            <span className="text-sm leading-6 text-slate-100">{choice.text}</span>
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
        className="rounded-xl border border-cyan-400/70 bg-cyan-500/15 px-4 py-3 text-sm font-medium text-cyan-100 transition-colors hover:bg-cyan-500/25"
        type="button"
      >
        Solved correctly
      </button>
      <button
        className="rounded-xl border border-orange-400/70 bg-orange-500/15 px-4 py-3 text-sm font-medium text-orange-100 transition-colors hover:bg-orange-500/25"
        type="button"
      >
        Needs review
      </button>
    </div>
  )
}

const renderFreeText = () => {
  return (
    <textarea
      className="min-h-28 w-full rounded-xl border border-cyan-500/40 bg-slate-900/80 px-4 py-3 text-sm leading-7 text-slate-100 outline-none placeholder:text-slate-400 focus:border-cyan-300"
      placeholder="Type your working"
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

export const Attempt4Renderer = ({ question }: Attempt4RendererProps) => {
  return (
    <section className="w-full max-w-5xl rounded-[2rem] border border-cyan-400/40 bg-slate-950/90 p-5 shadow-[0_0_80px_rgba(8,145,178,0.2)] sm:p-8">
      <header className="mb-7 rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-5">
        <p className="text-xs font-semibold tracking-[0.24em] text-cyan-300 uppercase">
          Attempt four
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
          High contrast lab mode
        </h1>
        <p className="mt-2 text-sm text-cyan-100/80">Question #{question.id}</p>
      </header>

      <article className="mb-6 rounded-2xl border border-cyan-500/30 bg-slate-900/70 p-5">
        <h2 className="mb-4 text-sm font-semibold tracking-[0.16em] text-cyan-300 uppercase">
          Question prompt
        </h2>
        <RichTextRendererStatic
          className="text-base leading-7 text-slate-100 [&_a]:text-cyan-300 [&_a]:underline"
          data={question.richText}
        />
      </article>

      <div className="space-y-4">
        {question.parts.map((part, index) => {
          return (
            <article
              className="rounded-2xl border border-cyan-500/30 bg-slate-900/70 p-5"
              key={part.id}
              style={{ contentVisibility: 'auto', containIntrinsicSize: '320px' }}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-white">Part {index + 1}</h3>
                <span className="rounded-full border border-cyan-500/40 bg-cyan-500/15 px-2.5 py-1 text-xs font-semibold tracking-[0.1em] text-cyan-200 uppercase">
                  Task
                </span>
              </div>

              {part.richText ? (
                <RichTextRendererStatic
                  className="mb-5 text-sm leading-7 text-slate-200 [&_a]:text-cyan-300 [&_a]:underline"
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
