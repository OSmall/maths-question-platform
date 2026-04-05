import { submitQuestionAnswersFormAction } from '@/app/actions/question-actions'
import { QuestionActionBar } from '@/components/question/question-action-bar'
import { QuestionAnswerField } from '@/components/question/question-answer-field'
import { QuestionHeader } from '@/components/question/question-header'
import { answerTypeLabel } from '@/components/question/question-utils'
import { QuestionReviewPanel } from '@/components/question/question-review-panel'
import { QuestionSessionSummary } from '@/components/question/question-session-summary'
import { QuestionToggleButton } from '@/components/question/question-toggle-button'
import { RichTextRenderer } from '@/components/rich-text/rich-text-renderer'
import { Badge } from '@/components/ui/badge'
import type {
  RenderableQuestion,
  RenderableQuestionSubmissionEvaluation,
} from '@/lib/domain/question'

type QuestionRendererProps = {
  isDraftMode: boolean
  question: RenderableQuestion
  questionSubmissionEvaluation: RenderableQuestionSubmissionEvaluation
}

export const QuestionRenderer = ({
  isDraftMode,
  question,
  questionSubmissionEvaluation,
}: QuestionRendererProps) => {
  return (
    <form action={submitQuestionAnswersFormAction} className="mx-auto w-full max-w-310">
      <input name="questionId" type="hidden" value={question.id} />
      <input name="seed" type="hidden" value={question.seed} />

      <div className="flex flex-col gap-4 lg:gap-6">
        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-6">
          <QuestionSessionSummary
            isDraftMode={isDraftMode}
            question={question}
            questionSubmissionEvaluation={questionSubmissionEvaluation}
          />

          <div className="min-w-0 space-y-4 lg:space-y-5">
            <article className="overflow-hidden rounded-[2rem] border border-border/70 bg-card/95 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.35)] backdrop-blur dark:border-border/70 dark:bg-card/90">
              <QuestionHeader
                isDraftMode={isDraftMode}
                question={question}
                answeredParts={questionSubmissionEvaluation.answeredParts}
              />

              {question.parts.map((part, index) => {
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
                              questionPart={part}
                              questionSubmissionEvaluation={questionSubmissionEvaluation}
                              seed={question.seed}
                            />
                          </div>
                        </div>

                        {questionSubmissionEvaluation.isEvaluated ? (
                          <QuestionReviewPanel
                            questionPart={part}
                            questionSubmissionEvaluatedPart={
                              questionSubmissionEvaluation.parts[part.id]
                            }
                          />
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
              question={question}
              questionSubmissionEvaluation={questionSubmissionEvaluation}
            />
          </div>
        </div>
      </div>
    </form>
  )
}
