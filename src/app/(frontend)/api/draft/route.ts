import { InvalidPreviewSlugError, UnauthorizedError } from '@/lib/errors'
import { enableDraftModeForSlug } from '@/lib/service/draft-service'
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const draft = await draftMode()

  const result = await enableDraftModeForSlug({
    headers: request.headers,
    slug: searchParams.get('slug'),
  })

  return result.match(
    ({ slug }) => {
      draft.enable()
      redirect(slug)
    },
    (error) => {
      draft.disable()

      if (error instanceof InvalidPreviewSlugError) {
        return new Response(error.message, { status: 400 })
      } else if (error instanceof UnauthorizedError) {
        return new Response(error.message, { status: 403 })
      }
      return new Response('Unable to enable draft mode', { status: 500 })
    },
  )
}
