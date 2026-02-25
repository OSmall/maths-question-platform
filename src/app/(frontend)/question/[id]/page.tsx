// import { draftMode } from 'next/headers'
import { RefreshRouteOnSave } from '@/components/live-preview/refresh-route-on-save'
import { QuestionRenderer } from '@/components/question/question-renderer'
import { getQuestionById } from '@/lib/service/question-service'
import { notFound } from 'next/navigation'

type QuestionLivePageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function QuestionLivePage({ params }: QuestionLivePageProps) {
  const { id } = await params
  // const { isEnabled: isDraftMode } = await draftMode() // todo draft mode

  const questionResult = await getQuestionById(id)
  return questionResult.match(
    (question) => (
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center px-4 py-8 md:px-6 md:py-10">
        <RefreshRouteOnSave />
        <QuestionRenderer question={question} />
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
