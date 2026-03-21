import { BookOpen, NotebookPen } from 'lucide-react'

import { submitQuestionAnswersFormAction } from '@/app/actions/question-actions'
import { RichTextRenderer } from '@/components/rich-text/rich-text-renderer'
import { Badge } from '@/components/ui/badge'
import type { Question } from '@/lib/domain/question'
import type {
  QuestionReviewPayload,
  SubmittedQuestionResponses,
} from '@/lib/domain/question-review'

import { QuestionActionBar } from './question-action-bar'
import { QuestionAnswerField } from './question-answer-field'
import { QuestionReviewPanel } from './question-review-panel'
import { QuestionSessionSummary } from './question-session-summary'
import type { QuestionReviewSummary, QuestionSessionMeta } from './question-study-types'
import { QuestionToggleButton } from './question-toggle-button'

type QuestionStudyExperienceProps = {
  isDraftMode: boolean
  question: Question
  responses: SubmittedQuestionResponses
  reviewError?: string | null
  reviewPayload: QuestionReviewPayload | null
  reviewSummary: QuestionReviewSummary | null
  seed: string
  sessionMeta: QuestionSessionMeta
}

export const QuestionStudyExperience = ({
  isDraftMode,
  question,
  responses,
  reviewError,
  reviewPayload,
  reviewSummary,
  seed,
  sessionMeta,
}: QuestionStudyExperienceProps) => {
  const isSubmitted = reviewPayload !== null || reviewError != null
  const answeredCount = reviewSummary?.answeredCount ?? 0

  return (
    <form action={submitQuestionAnswersFormAction} className="mx-auto w-full max-w-310">
      <input name="questionId" type="hidden" value={question.id} />
      <input name="seed" type="hidden" value={seed} />

      <div className="flex flex-col gap-4 lg:gap-6">
        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-6">
          <QuestionSessionSummary
            isDraftMode={isDraftMode}
            question={question}
            reviewSummary={reviewSummary}
            sessionMeta={sessionMeta}
          />

          <div className="min-w-0 space-y-4 lg:space-y-5">
            <article className="overflow-hidden rounded-[2rem] border border-border/70 bg-card/95 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.35)] backdrop-blur dark:border-border/70 dark:bg-card/90">
              <QuestionHeader
                answeredCount={answeredCount}
                isDraftMode={isDraftMode}
                question={question}
              />

              {question.parts.map((part, index) => {
                const review = reviewPayload?.parts[part.id]
                const response = responses[part.id]

                return (
                  <div key={part.id}>
                    <section
                      className="scroll-mt-28 px-5 py-6 sm:px-8 sm:py-7"
                      id={`part-${part.id}`}
                      style={{ contentVisibility: 'auto', containIntrinsicSize: '420px' }}
                    >
                      <div className="space-y-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-2">
                            {question.parts.length > 1 ? (
                              <div className="inline-flex items-center gap-3 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
                                <span className="flex size-6 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                                  {index + 1}
                                </span>
                                Part {index + 1}
                              </div>
                            ) : null}

                            {part.prompt ? (
                              <RichTextRenderer
                                className="text-base leading-8 text-foreground/90 sm:text-lg [&_p:last-child]:mb-0"
                                data={part.prompt}
                              />
                            ) : question.parts.length > 1 ? null : (
                              <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                                Choose the response that best matches your working, then review the
                                complete solution after submission.
                              </p>
                            )}
                          </div>

                          <QuestionToggleButton
                            activeClassName="border-primary/25 bg-primary/10 text-foreground hover:bg-primary/15"
                            activeLabel="Flagged"
                            className="shrink-0"
                            icon="flag"
                            inactiveLabel="Flag"
                          />
                        </div>

                        <div className="rounded-[1.6rem] border border-border/70 bg-background/75 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] sm:p-4 dark:bg-background/35 dark:shadow-none">
                          <div className="space-y-3 rounded-[1.2rem] border border-border/50 bg-card/80 p-3 sm:p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-foreground">Your answer</p>
                                <p className="text-sm text-muted-foreground">
                                  {part.response.type === 'multipleChoice'
                                    ? 'Pick one option. The entire question is checked in one submission.'
                                    : part.response.type === 'shortText'
                                      ? 'Enter your final answer. You can still submit blank parts.'
                                      : 'Mark whether you solved this confidently before you review the model solution.'}
                                </p>
                              </div>

                              <Badge
                                className="rounded-full px-3 py-1 text-[11px] font-semibold"
                                variant="outline"
                              >
                                {answerTypeLabel(part.response.type)}
                              </Badge>
                            </div>

                            <QuestionAnswerField
                              part={part}
                              response={response}
                              reviewMode={isSubmitted}
                              seed={seed}
                            />
                          </div>
                        </div>

                        {review ? (
                          <QuestionReviewPanel part={part} response={response} review={review} />
                        ) : null}
                      </div>
                    </section>

                    {index < question.parts.length - 1 ? (
                      <div className="h-px bg-border/70" />
                    ) : null}
                  </div>
                )
              })}
            </article>

            <QuestionActionBar
              isSubmitted={isSubmitted}
              questionPartCount={question.parts.length}
              reviewError={reviewError}
              reviewSummary={reviewSummary}
            />
          </div>
        </div>
      </div>
    </form>
  )
}

type QuestionHeaderProps = {
  answeredCount: number
  isDraftMode: boolean
  question: Question
}

const QuestionHeader = ({ answeredCount, isDraftMode, question }: QuestionHeaderProps) => {
  const answerTypes = Array.from(
    new Set(question.parts.map((part) => answerTypeLabel(part.response.type))),
  )

  return (
    <header className="space-y-6 border-b border-border/70 px-5 py-6 sm:px-8 sm:py-8">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="rounded-full px-3 py-1 text-[11px] font-semibold" variant="outline">
          Question {question.id}
        </Badge>
        {answerTypes.map((label) => (
          <Badge
            className="rounded-full px-3 py-1 text-[11px] font-semibold"
            key={label}
            variant="outline"
          >
            {label}
          </Badge>
        ))}
        {isDraftMode ? (
          <Badge className="rounded-full px-3 py-1 text-[11px] font-semibold" variant="outline">
            Live draft preview
          </Badge>
        ) : null}
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <BookOpen className="size-4" />
            Read the full prompt first, then answer every part.
          </span>
          <span className="inline-flex items-center gap-2">
            <NotebookPen className="size-4" />
            {answeredCount} of {question.parts.length} parts touched
          </span>
        </div>

        <RichTextRenderer
          className="max-w-4xl text-base leading-8 text-foreground/90 sm:text-lg sm:leading-9 [&_figure]:my-6 [&_figure]:overflow-hidden [&_figure]:rounded-[1.6rem] [&_figure]:border [&_figure]:border-border/70 [&_figure]:bg-background/80 [&_figure]:shadow-[0_20px_40px_-32px_rgba(15,23,42,0.38)] [&_img]:max-h-107.5 [&_img]:w-full [&_img]:object-contain [&_p:first-child]:text-[1.7rem] [&_p:first-child]:leading-[1.18] [&_p:first-child]:font-semibold [&_p:first-child]:tracking-tight sm:[&_p:first-child]:text-[2.35rem]"
          data={question.prompt ?? null}
        />
      </div>
    </header>
  )
}

function answerTypeLabel(answerType: Question['parts'][number]['response']['type']) {
  switch (answerType) {
    case 'multipleChoice':
      return 'Multiple choice'
    case 'shortText':
      return 'Short text'
    case 'selfReport':
      return 'Self report'
    default:
      return 'Answer'
  }
}
