import { ArrowRight, SkipForward } from 'lucide-react'
import Link from 'next/link'

import { RenderableQuestion, RenderableQuestionSubmissionEvaluation } from '@/lib/domain/question'
import { QuestionSubmitButton } from './question-submit-button'
import { Button } from '@/components/ui/button'

type QuestionControlConfig = {
  disabled?: boolean
}

type QuestionContinueConfig = QuestionControlConfig & {
  href?: string
}

type QuestionActionBarProps = {
  flagControl?: React.ReactNode
  question: RenderableQuestion
  questionSubmissionEvaluation: RenderableQuestionSubmissionEvaluation
  controls?: {
    continue?: QuestionContinueConfig
    skip?: QuestionControlConfig
    submit?: QuestionControlConfig
  }
}

export const QuestionActionBar = ({
  flagControl,
  question,
  questionSubmissionEvaluation,
  controls,
}: QuestionActionBarProps) => {
  const isSubmitted = questionSubmissionEvaluation.isEvaluated
  return (
    <div className="sticky bottom-3 z-20">
      <div className="rounded-[1.7rem] border border-border/80 bg-card/92 p-3 shadow-[0_24px_50px_-30px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:bg-card/88 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {isSubmitted
                ? `${questionSubmissionEvaluation.correctParts} of ${question.parts.length} parts ready to carry forward`
                : 'Answer every part when you can, then check the whole question once'}
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
              {isSubmitted
                ? 'Review mode is a read-only snapshot for this placeholder flow.'
                : `Blank parts can still be submitted. The server will evaluate the whole question together.`}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={controls?.skip?.disabled}
              formNoValidate
              name="intent"
              type="submit"
              value="skip"
              variant="outline"
            >
              <SkipForward data-icon="inline-start" />
              Skip
            </Button>
            {flagControl}
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            {isSubmitted ? (
              <ContinueControl config={controls?.continue} />
            ) : (
              <QuestionSubmitButton disabled={controls?.submit?.disabled} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ContinueControl({ config }: { config?: QuestionContinueConfig }) {
  if (config?.href && !config.disabled) {
    return (
      <Button render={<Link href={config.href} />}>
        <ArrowRight data-icon="inline-start" />
        Continue
      </Button>
    )
  }

  return (
    <Button disabled type="button">
      <ArrowRight data-icon="inline-start" />
      Continue
    </Button>
  )
}
