import { RefreshRouteOnSave } from '@/components/live-preview/refresh-route-on-save'
import { QuestionPreviewWarning } from '@/components/question/question-preview-warning'
import { QuestionRenderer } from '@/components/question/question-renderer'
import { submitQuestionReview } from '@/lib/actions'
import { QuestionNotRenderableError } from '@/lib/errors'
import { getQuestionById } from '@/lib/service/question-service'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'

type QuestionPageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function QuestionPage({ params }: QuestionPageProps) {
  const [{ id }, { isEnabled: isDraftMode }] = await Promise.all([params, draftMode()])

  const questionResult = await getQuestionById(id, { draft: isDraftMode })

  return questionResult.match(
    (question) => (
      <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.16),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.94))] px-4 py-5 dark:bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.14),transparent_28%),linear-gradient(180deg,rgba(12,18,24,0.98),rgba(15,23,42,0.96))] md:px-6 md:py-8">
        {isDraftMode && <RefreshRouteOnSave />}
        <div className="mx-auto flex w-full justify-center">
          <QuestionRenderer
            isDraftMode={isDraftMode}
            question={question}
            reviewQuestionAction={submitQuestionReview}
          />
        </div>
      </div>
    ),
    (err) => {
      if (isDraftMode && err instanceof QuestionNotRenderableError) {
        return (
          <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center px-4 py-8 md:px-6 md:py-10">
            <RefreshRouteOnSave />
            <div className="w-full max-w-3xl">
              <QuestionPreviewWarning validationError={err.validationError} />
            </div>
          </div>
        )
      }

      console.warn(
        `Cannot fetch Question entity due to ${err.name}, redirecting to Not Found page`,
        err,
      )
      notFound()
    },
  )
}
