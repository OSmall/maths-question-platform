import { RefreshRouteOnSave } from '@/components/live-preview/refresh-route-on-save'
import { Attempt7Renderer } from '@/components/question-test/attempt-7-renderer'
import { getQuestionById } from '@/lib/service/question-service'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'

type QuestionTestPageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function QuestionTest7Page({ params }: QuestionTestPageProps) {
  const [{ id }, { isEnabled: isDraftMode }] = await Promise.all([params, draftMode()])

  const questionResult = await getQuestionById(id, { draft: isDraftMode })

  return questionResult.match(
    (question) => (
      <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top,_#fffbeb_0%,_#fffef9_45%,_#ffffff_100%)] px-4 py-8 dark:bg-[radial-gradient(circle_at_top,_#78350f_0%,_#111827_45%,_#020617_100%)] md:px-6 md:py-10">
        {isDraftMode ? <RefreshRouteOnSave /> : null}
        <div className="mx-auto flex w-full justify-center">
          <Attempt7Renderer question={question} />
        </div>
      </div>
    ),
    (err) => {
      console.warn(
        `Cannot fetch Question entity due to ${err.name}, redirecting to Not Found page`,
        err,
      )
      notFound()
    },
  )
}
