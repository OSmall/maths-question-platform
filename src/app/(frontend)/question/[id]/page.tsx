import { RefreshRouteOnSave } from '@/components/live-preview/refresh-route-on-save'
import { QuestionPreviewWarning } from '@/components/question/question-preview-warning'
import { QuestionRenderer } from '@/components/question/question-renderer'
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
      <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top,#ecfdf5_0%,#f8fffb_45%,#ffffff_100%)] px-4 py-8 dark:bg-[radial-gradient(circle_at_top,#064e3b_0%,#111827_45%,#020617_100%)] md:px-6 md:py-10">
        {isDraftMode && <RefreshRouteOnSave />}
        <div className="mx-auto flex w-full justify-center">
          <QuestionRenderer question={question} />
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
