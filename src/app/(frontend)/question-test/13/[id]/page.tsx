import { RefreshRouteOnSave } from '@/components/live-preview/refresh-route-on-save'
import { Attempt13Renderer } from '@/components/question-test/attempt-13-renderer'
import { getQuestionById } from '@/lib/service/question-service'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'

type QuestionTestPageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function QuestionTest13Page({ params }: QuestionTestPageProps) {
  const { id } = await params
  const { isEnabled: isDraftMode } = await draftMode()

  const questionResult = await getQuestionById(id, { draft: isDraftMode })

  return questionResult.match(
    (question) => (
      <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.14),transparent_45%),radial-gradient(circle_at_85%_10%,hsl(var(--accent)/0.16),transparent_45%),hsl(var(--background))] px-4 py-8 md:px-6 md:py-10">
        {isDraftMode ? <RefreshRouteOnSave /> : null}
        <div className="mx-auto flex w-full max-w-5xl justify-center">
          <Attempt13Renderer question={question} />
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
