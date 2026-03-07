import { RefreshRouteOnSave } from '@/components/live-preview/refresh-route-on-save'
import { Attempt15Renderer } from '@/components/question-test/attempt-15-renderer'
import { getQuestionById } from '@/lib/service/question-service'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'

type QuestionTestPageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function QuestionTest15Page({ params }: QuestionTestPageProps) {
  const { id } = await params
  const { isEnabled: isDraftMode } = await draftMode()

  const questionResult = await getQuestionById(id, { draft: isDraftMode })

  return questionResult.match(
    (question) => (
      <div className="min-h-screen w-full bg-gradient-to-b from-background via-secondary/20 to-background px-4 py-8 md:px-6 md:py-10">
        {isDraftMode ? <RefreshRouteOnSave /> : null}
        <div className="mx-auto flex w-full justify-center">
          <Attempt15Renderer question={question} />
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
