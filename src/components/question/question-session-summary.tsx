import { Clock3, NotebookPen, Target } from 'lucide-react'

import { answerTypeLabel } from '@/components/question/question-utils'
import { QuestionTimer } from '@/components/question/question-timer'
import { Badge } from '@/components/ui/badge'
import type {
  RenderableQuestion,
  RenderableQuestionSubmissionEvaluation,
} from '@/lib/domain/question'

type QuestionSessionSummaryProps = {
  isDraftMode: boolean
  question: RenderableQuestion
  questionSubmissionEvaluation: RenderableQuestionSubmissionEvaluation
  timer?: {
    begunAt?: string
    endedAt?: string
  }
}

export const QuestionSessionSummary = ({
  isDraftMode,
  question,
  questionSubmissionEvaluation,
  timer,
}: QuestionSessionSummaryProps) => {
  const completionPercent = 50
  const answeredCount = 0
  const flaggedCount = 0
  const activeAccuracyLabel = 'active accuracy label'
  const attemptLabel = 'Attempt #1'

  return (
    <>
      <section className="space-y-3 lg:hidden">
        <div className="rounded-[1.7rem] border border-border/70 bg-card/95 p-4 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.35)] backdrop-blur dark:bg-card/90">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full px-3 py-1 text-[11px] font-semibold" variant="outline">
              {attemptLabel}
            </Badge>
            {isDraftMode ? (
              <Badge className="rounded-full px-3 py-1 text-[11px] font-semibold" variant="outline">
                Draft preview
              </Badge>
            ) : null}
          </div>

          <div className="mt-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Study session</p>
              <p className="text-xl font-semibold text-foreground">Question {question.index + 1}</p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/80 px-3 py-2 text-right">
              <p className="text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                Accuracy
              </p>
              <p className="text-sm font-semibold text-foreground">{activeAccuracyLabel}</p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex w-full items-center gap-2 text-sm font-medium text-foreground">
              <span>Question progress</span>
              <span className="ml-auto text-sm text-muted-foreground tabular-nums">
                {answeredCount + '/' + question.parts.length}
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-4xl bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
            <CompactStat label="Time" value={<QuestionTimer {...timer} />} />
            <CompactStat label="Flagged" value={String(flaggedCount)} />
            <CompactStat label="Review" value="Pending" />
          </div>
        </div>
      </section>

      <aside className="hidden space-y-4 lg:sticky lg:top-6 lg:block lg:self-start">
        <div className="rounded-[1.9rem] border border-border/70 bg-card/95 p-5 shadow-[0_20px_40px_-28px_rgba(15,23,42,0.35)] backdrop-blur dark:bg-card/90">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full px-3 py-1 text-[11px] font-semibold" variant="outline">
              {attemptLabel}
            </Badge>
            {isDraftMode ? (
              <Badge
                className="rounded-full px-3 py-1 text-[11px] font-semibold"
                variant="secondary"
              >
                Draft preview
              </Badge>
            ) : null}
          </div>

          <div className="mt-4 space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Study session</p>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Question {question.index + 1}
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Read, answer, review the worked methods, then continue.
            </p>
          </div>

          <div className="mt-5 space-y-4">
            <div className="space-y-2">
              <div className="flex w-full items-center gap-2 text-sm font-medium text-foreground">
                <span>Question progress</span>
                <span className="ml-auto text-sm text-muted-foreground tabular-nums">
                  {answeredCount + '/' + question.parts.length}
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-4xl bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>

            <div className="grid gap-2.5 text-sm">
              <RailMetric icon={Target} label="Accuracy" value={activeAccuracyLabel} />
              <RailMetric icon={Clock3} label="Time spent" value={<QuestionTimer {...timer} />} />
              <RailMetric icon={NotebookPen} label="Estimate" value="9 min" />
              <RailMetric icon={Target} label="Flagged" value={`${flaggedCount} marked`} />
            </div>
          </div>

          {question.subTopics.length > 0 ? (
            <>
              <div className="my-5 h-px bg-border/70" />

              <div className="space-y-3">
                <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                  Current focus
                </p>
                <div className="flex flex-wrap gap-2">
                  {question.subTopics.map((subTopic) => (
                    <Badge
                      className="rounded-full px-3 py-1 text-xs font-medium"
                      key={`${subTopic.topicName}-${subTopic.subtopicName}`}
                      variant="outline"
                    >
                      {subTopic.topicName} / {subTopic.subtopicName}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          ) : null}

          {questionSubmissionEvaluation.isEvaluated ? (
            <>
              <div className="my-5 h-px bg-border/70" />
              <div className="rounded-[1.4rem] border border-border/70 bg-background/75 p-4">
                <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                  This question
                </p>
                <div className="mt-3 space-y-2 text-sm">
                  <p className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Correct</span>
                    <span className="font-semibold text-foreground">
                      {questionSubmissionEvaluation.correctParts}
                    </span>
                  </p>
                  <p className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Needs review</span>
                    <span className="font-semibold text-foreground">
                      {questionSubmissionEvaluation.incorrectParts}
                    </span>
                  </p>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {question.parts.length > 1 ? (
          <div className="rounded-[1.7rem] border border-border/70 bg-card/95 p-4 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.28)] backdrop-blur dark:bg-card/90">
            <p className="px-1 text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              Question parts
            </p>
            <div className="mt-3 space-y-2">
              {question.parts.map((part, index) => (
                <a
                  className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/65 px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                  href={`#part-${part.id}`}
                  key={part.id}
                >
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                    {index + 1}
                  </span>
                  <div>
                    <p>Part {index + 1}</p>
                    <p className="text-xs text-muted-foreground">
                      {answerTypeLabel(part.response.type)}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </aside>
    </>
  )
}

const CompactStat = ({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) => {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/75 px-3 py-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="text-[11px] font-semibold tracking-[0.14em] uppercase">{label}</span>
      </div>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    </div>
  )
}

const RailMetric = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: React.ReactNode
}) => {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/70 px-3 py-3">
      <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
          {label}
        </p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}
