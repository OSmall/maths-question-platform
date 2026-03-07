import { RefreshRouteOnSave } from '@/components/live-preview/refresh-route-on-save'
import { Attempt4Renderer } from '@/components/question-test/attempt-4-renderer'
import { getQuestionById } from '@/lib/service/question-service'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'

type QuestionTestPageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function QuestionTest4Page({ params }: QuestionTestPageProps) {
  const [{ id }, { isEnabled: isDraftMode }] = await Promise.all([params, draftMode()])

  const questionResult = await getQuestionById(id, { draft: isDraftMode })

  return questionResult.match(
    (question) => (
      <div className="min-h-screen w-full bg-[radial-gradient(circle_at_40%_-20%,_#164e63_0%,_#020617_38%,_#000000_100%)] px-4 py-8 md:px-6 md:py-10">
        {isDraftMode ? <RefreshRouteOnSave /> : null}
        <div className="mx-auto flex w-full justify-center">
          <Attempt4Renderer question={question} />
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
