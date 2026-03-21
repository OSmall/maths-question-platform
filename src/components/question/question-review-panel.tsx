import { CheckCircle2, CircleAlert, SkipForward } from 'lucide-react'

import { RichTextRenderer } from '@/components/rich-text/rich-text-renderer'
import { cn } from '@/lib/utils'
import type { Question } from '@/lib/domain/question'
import type { QuestionReviewPart } from '@/lib/domain/question-review'

type QuestionReviewPanelProps = {
  part: Question['parts'][number]
  response: string | undefined
  review: QuestionReviewPart
}

export const QuestionReviewPanel = ({ part, response, review }: QuestionReviewPanelProps) => {
  const accentClassName =
    review.status === 'correct'
      ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300'
      : review.status === 'incorrect'
        ? 'bg-amber-500/12 text-amber-700 dark:text-amber-300'
        : 'border border-border/70 bg-muted/70 text-foreground'

  return (
    <section className="rounded-[1.6rem] border border-border/70 bg-background/70 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold',
              accentClassName,
            )}
          >
            {review.status === 'correct' ? (
              <CheckCircle2 className="size-4" />
            ) : review.status === 'incorrect' ? (
              <CircleAlert className="size-4" />
            ) : (
              <SkipForward className="size-4" />
            )}
            {review.title}
          </div>
          <p className="max-w-3xl text-sm leading-7 text-muted-foreground">{review.body}</p>
        </div>

        {review.correctAnswerText ? (
          <div className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm shadow-sm">
            <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              Correct answer
            </p>
            <p className="mt-1 font-medium text-foreground">{review.correctAnswerText}</p>
          </div>
        ) : null}
      </div>

      {review.workedSolutions.length > 0 ? (
        <div className="mt-5 space-y-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Worked solutions</p>
            <p className="text-sm text-muted-foreground">
              {response
                ? 'Compare your answer with the methods below.'
                : 'Use the methods below to rebuild the answer from scratch.'}
            </p>
          </div>

          <div className="space-y-3">
            {review.workedSolutions.map((solutionMethod, index) => (
              <details
                className="overflow-hidden rounded-[1.3rem] border border-border/70 bg-background/70"
                key={solutionMethod.id}
              >
                <summary className="flex cursor-pointer list-none items-start gap-3 px-4 py-4 text-base font-semibold text-foreground marker:hidden">
                  <span className="mt-0.5 flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {index + 1}
                  </span>
                  <span>
                    <span className="block">Solution {index + 1}</span>
                    <span className="mt-1 block text-sm font-normal text-muted-foreground">
                      Worked solution {index + 1} for {part.prompt ? 'this part' : 'the question'}
                    </span>
                  </span>
                </summary>
                <div className="border-t border-border/70 px-4 py-4">
                  <RichTextRenderer
                    className="text-sm leading-7 text-foreground/85 [&_p:last-child]:mb-0"
                    data={solutionMethod.prompt}
                  />
                </div>
              </details>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}
