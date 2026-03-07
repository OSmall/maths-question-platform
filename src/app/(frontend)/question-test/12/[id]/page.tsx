import { RefreshRouteOnSave } from '@/components/live-preview/refresh-route-on-save'
import { Attempt12Renderer } from '@/components/question-test/attempt-12-renderer'
import { getQuestionById } from '@/lib/service/question-service'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'

type QuestionTestPageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function QuestionTest12Page({ params }: QuestionTestPageProps) {
  const { id } = await params
  const { isEnabled: isDraftMode } = await draftMode()

  const questionResult = await getQuestionById(id, { draft: isDraftMode })
  return questionResult.match(
    (question) => (
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center px-4 py-8 md:px-6 md:py-10">
        {isDraftMode && <RefreshRouteOnSave />}
        <Attempt12Renderer question={question} />
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
