import { RefreshRouteOnSave } from '@/components/live-preview/refresh-route-on-save'
import { Attempt1Renderer } from '@/components/question-test/attempt-1-renderer'
import { getQuestionById } from '@/lib/service/question-service'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'

type QuestionTestPageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function QuestionTest1Page({ params }: QuestionTestPageProps) {
  const [{ id }, { isEnabled: isDraftMode }] = await Promise.all([params, draftMode()])

  const questionResult = await getQuestionById(id, { draft: isDraftMode })

  return questionResult.match(
    (question) => (
      <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-b from-sky-100 via-cyan-50 to-white px-4 py-8 md:px-6 md:py-10">
        {isDraftMode ? <RefreshRouteOnSave /> : null}
        <Attempt1Renderer question={question} />
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
