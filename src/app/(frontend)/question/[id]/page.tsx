import { getPayload } from 'payload'
import config from '@payload-config'
import { draftMode } from 'next/headers'
import { RefreshRouteOnSave } from '@/components/live-preview/refresh-route-on-save'
import { QuestionRenderer } from '@/components/question/question-renderer'

type QuestionLivePageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function QuestionLivePage({ params }: QuestionLivePageProps) {
  const { id } = await params
  console.log(id)
  const { isEnabled: isDraftMode } = await draftMode()
  const payload = await getPayload({ config })
  const question = await payload.findByID({
    collection: 'question',
    id,
    // draft: isDraftMode,
    draft: true,
    // trash: true, // add this if trash is enabled in your collection and want to preview trashed documents
  })

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center px-4 py-8 md:px-6 md:py-10">
      <RefreshRouteOnSave />
      <QuestionRenderer question={question} />
    </div>
  )
}
