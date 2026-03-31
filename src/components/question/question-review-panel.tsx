import { CheckCircle2, CircleAlert } from 'lucide-react'

import { RichTextRenderer } from '@/components/rich-text/rich-text-renderer'
import { cn } from '@/lib/utils'
import {
  RenderableQuestionPart,
  RenderableQuestionSubmissionEvaluatedPart,
} from '@/lib/domain/question'

type QuestionReviewPanelProps = {
  // review: QuestionReviewPart

  questionPart: RenderableQuestionPart
  questionSubmissionEvaluatedPart: RenderableQuestionSubmissionEvaluatedPart
}

export const QuestionReviewPanel = ({
  questionPart,
  questionSubmissionEvaluatedPart,
}: QuestionReviewPanelProps) => {
  const isCorrect = questionSubmissionEvaluatedPart.isCorrect
  const accentClassName = isCorrect
    ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300'
    : 'bg-amber-500/12 text-amber-700 dark:text-amber-300'

  function getCorrectAnswer() {
    switch (questionSubmissionEvaluatedPart.type) {
      case 'shortText':
        return questionSubmissionEvaluatedPart.correctResponses[0]
      case 'selfReport':
        return true
      case 'multipleChoice':
        const correctChoiceId = questionSubmissionEvaluatedPart.correctChoiceId
        if (questionPart.response.type !== 'multipleChoice')
          throw new Error(`Expected multiple choice but got ${questionPart.response.type}`)
        return questionPart.response.choices[correctChoiceId].text
    }
  }

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
            {isCorrect ? <CheckCircle2 className="size-4" /> : <CircleAlert className="size-4" />}
          </div>
        </div>

        {isCorrect ? (
          <div className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm shadow-sm">
            <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              Correct answer
            </p>
            <p className="mt-1 font-medium text-foreground">{getCorrectAnswer()}</p>
          </div>
        ) : null}
      </div>

      {questionSubmissionEvaluatedPart.workedSolutions.length > 0 ? (
        <div className="mt-5 space-y-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Worked solutions</p>
          </div>

          <div className="space-y-3">
            {questionSubmissionEvaluatedPart.workedSolutions.map((workedSolution, index) => (
              <details
                className="overflow-hidden rounded-[1.3rem] border border-border/70 bg-background/70"
                key={workedSolution.id}
              >
                <summary className="flex cursor-pointer list-none items-start gap-3 px-4 py-4 text-base font-semibold text-foreground marker:hidden">
                  <span className="mt-0.5 flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {index + 1}
                  </span>
                  <span>
                    <span className="block">Solution {index + 1}</span>
                    <span className="mt-1 block text-sm font-normal text-muted-foreground">
                      Worked solution {index + 1} for{' '}
                      {questionPart.prompt ? 'this part' : 'the question'}
                    </span>
                  </span>
                </summary>
                <div className="border-t border-border/70 px-4 py-4">
                  <RichTextRenderer
                    className="text-sm leading-7 text-foreground/85 [&_p:last-child]:mb-0"
                    data={workedSolution.prompt}
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
