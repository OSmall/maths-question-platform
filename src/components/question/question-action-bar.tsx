import { ArrowRight, SkipForward } from 'lucide-react'

import { QuestionSubmitButton } from './question-submit-button'
import { QuestionToggleButton } from './question-toggle-button'
import type { QuestionReviewSummary } from './question-study-types'

type QuestionActionBarProps = {
  isSubmitted: boolean
  questionPartCount: number
  reviewError?: string | null
  reviewSummary: QuestionReviewSummary | null
}

export const QuestionActionBar = ({
  isSubmitted,
  questionPartCount,
  reviewError,
  reviewSummary,
}: QuestionActionBarProps) => {
  return (
    <div className="sticky bottom-3 z-20">
      <div className="rounded-[1.7rem] border border-border/80 bg-card/92 p-3 shadow-[0_24px_50px_-30px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:bg-card/88 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {isSubmitted
                ? reviewSummary
                  ? `${reviewSummary.correctCount} of ${questionPartCount} parts ready to carry forward`
                  : 'Review ready'
                : 'Answer every part when you can, then check the whole question once'}
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
              {isSubmitted
                ? 'Review mode is a read-only snapshot for this placeholder flow.'
                : `Blank parts can still be submitted. The server will evaluate the whole question together.`}
            </p>
            {reviewError ? (
              <p className="mt-2 text-sm font-medium text-amber-700 dark:text-amber-300">
                {reviewError}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-border bg-input/30 px-3 text-sm font-medium text-foreground transition-all hover:bg-input/50"
              type="button"
            >
              <SkipForward className="size-4" />
              Skip
            </button>
            <QuestionToggleButton
              activeClassName="border-primary/35 bg-primary/10 text-foreground hover:bg-primary/15"
              activeLabel="Saved"
              icon="bookmark"
              inactiveLabel="Save"
              inactiveClassName="border-border bg-input/30 text-foreground hover:bg-input/50"
            />
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            {isSubmitted ? (
              <button
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-transparent bg-primary px-5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/80"
                type="button"
              >
                <ArrowRight className="size-4" />
                Continue
              </button>
            ) : (
              <QuestionSubmitButton />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
