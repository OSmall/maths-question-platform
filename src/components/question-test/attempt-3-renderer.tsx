import { assertNever } from '@/lib/utils/types'
import { MultipleChoiceAnswerMechanism, Question, QuestionPart } from '@/lib/domain/question'

import { RichTextRendererStatic } from './rich-text-renderer-static'

type Attempt3RendererProps = {
  question: Question
}

const renderMultipleChoice = (partId: string, answerMechanism: MultipleChoiceAnswerMechanism) => {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-xs font-semibold tracking-[0.14em] text-emerald-700 uppercase">
        Pick an option
      </legend>
      {answerMechanism.choices.map((choice) => {
        const inputId = `a3-${partId}-${choice.id}`

        return (
          <label
            className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-white px-3 py-2.5 transition-colors hover:border-emerald-300"
            htmlFor={inputId}
            key={choice.id}
          >
            <input
              className="mt-1 size-4 accent-emerald-700"
              id={inputId}
              name={partId}
              type="radio"
            />
            <span className="text-sm leading-6 text-slate-700">{choice.text}</span>
          </label>
        )
      })}
    </fieldset>
  )
}

const renderSelfReport = () => {
  return (
    <div className="flex flex-wrap gap-3">
      <button
        className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 transition-colors hover:bg-emerald-100"
        type="button"
      >
        Correct
      </button>
      <button
        className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-100"
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
      className="min-h-24 w-full rounded-xl border border-emerald-200 bg-white px-3 py-2.5 text-sm leading-6 text-slate-800 outline-none focus:border-emerald-500"
      placeholder="Type your answer"
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

export const Attempt3Renderer = ({ question }: Attempt3RendererProps) => {
  return (
    <section className="w-full max-w-6xl rounded-[2rem] border border-emerald-100 bg-white/90 p-5 shadow-xl backdrop-blur-sm sm:p-8">
      <div className="grid gap-6 lg:grid-cols-12">
        <aside className="space-y-4 lg:col-span-4 lg:sticky lg:top-8 lg:self-start">
          <div className="rounded-3xl border border-emerald-100 bg-gradient-to-b from-emerald-50 to-white p-5">
            <p className="text-xs font-semibold tracking-[0.18em] text-emerald-700 uppercase">
              Attempt three
            </p>
            <h2 className="mt-2 text-xl leading-tight font-semibold text-slate-900">
              Split study layout
            </h2>
            <p className="mt-2 text-sm text-slate-600">Question #{question.id}</p>
          </div>

          <nav className="rounded-3xl border border-emerald-100 bg-white p-5">
            <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase">
              Parts
            </p>
            <ul className="space-y-2">
              {question.parts.map((part, index) => {
                return (
                  <li key={part.id}>
                    <a
                      className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm text-slate-700 transition-colors hover:bg-emerald-50 hover:text-emerald-800"
                      href={`#part-${part.id}`}
                    >
                      <span className="inline-flex size-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-800">
                        {index + 1}
                      </span>
                      Part {index + 1}
                    </a>
                  </li>
                )
              })}
            </ul>
          </nav>
        </aside>

        <div className="space-y-5 lg:col-span-8">
          <article className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
            <h1 className="mb-4 text-lg font-semibold text-slate-900">Question prompt</h1>
            <RichTextRendererStatic
              className="text-base leading-7 text-slate-800"
              data={question.richText}
            />
          </article>

          {question.parts.map((part, index) => {
            return (
              <article
                className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm"
                id={`part-${part.id}`}
                key={part.id}
                style={{ contentVisibility: 'auto', containIntrinsicSize: '360px' }}
              >
                <div className="mb-4 flex items-center gap-2">
                  <span className="inline-flex size-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
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
