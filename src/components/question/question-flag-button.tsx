'use client'

import { Flag } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import useSWR from 'swr'

import { Button } from '@/components/ui/button'
import type { UUID } from '@/lib/domain/uuid'

type FlagState = {
  flagged: boolean
}

function getFlagErrorMessage(error: unknown) {
  return error instanceof Error && error.message ? error.message : 'Unable to update flag'
}

type PreviewQuestionFlagButtonProps = {
  initialFlagged: boolean
}

type StudySessionQuestionFlagButtonProps = {
  initialFlagged: boolean
  questionNumber: number
  setFlaggedAction: (input: {
    flagged: boolean
    questionNumber: number
    studySessionId: UUID
  }) => Promise<{
    data?: { flagged: boolean } | { message: string; status: 'error' }
    serverError?: string
  } | void>
  studySessionId: UUID
}

export function PreviewQuestionFlagButton({ initialFlagged }: PreviewQuestionFlagButtonProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const cacheKey = `preview-question-flag:${searchParams.toString()}`
  const { data, mutate, isValidating } = useSWR<FlagState>(cacheKey, null, {
    fallbackData: { flagged: initialFlagged },
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  })
  const flagged = data?.flagged ?? initialFlagged

  return (
    <Button
      aria-pressed={flagged}
      disabled={isValidating}
      onClick={() => {
        const nextFlagged = !flagged

        void mutate(
          async () => {
            const nextSearchParams = new URLSearchParams(searchParams.toString())

            if (nextFlagged) {
              nextSearchParams.set('flagged', '1')
            } else {
              nextSearchParams.delete('flagged')
            }

            const queryString = nextSearchParams.toString()
            router.replace(queryString ? `${pathname}?${queryString}` : pathname)

            return { flagged: nextFlagged }
          },
          {
            optimisticData: { flagged: nextFlagged },
            populateCache: true,
            revalidate: false,
            rollbackOnError: true,
          },
        ).catch((error: unknown) => {
          toast.error(getFlagErrorMessage(error))
        })
      }}
      type="button"
      variant={flagged ? 'secondary' : 'outline'}
    >
      <Flag data-icon="inline-start" className={flagged ? 'fill-current' : undefined} />
      {flagged ? 'Flagged' : 'Flag'}
    </Button>
  )
}

export function StudySessionQuestionFlagButton({
  initialFlagged,
  questionNumber,
  setFlaggedAction,
  studySessionId,
}: StudySessionQuestionFlagButtonProps) {
  const router = useRouter()
  const cacheKey = `study-session-question-flag:${studySessionId}:${questionNumber}`
  const { data, mutate, isValidating } = useSWR<FlagState>(cacheKey, null, {
    fallbackData: { flagged: initialFlagged },
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  })
  const flagged = data?.flagged ?? initialFlagged

  return (
    <Button
      aria-pressed={flagged}
      disabled={isValidating}
      onClick={() => {
        const nextFlagged = !flagged

        void mutate(
          async () => {
            const result = await setFlaggedAction({
              flagged: nextFlagged,
              questionNumber,
              studySessionId,
            })

            if (result?.serverError) {
              throw new Error(result.serverError)
            }

            if (result?.data && 'status' in result.data && result.data.status === 'error') {
              throw new Error(result.data.message)
            }

            if (result?.data && 'flagged' in result.data) {
              router.refresh()
              return { flagged: result.data.flagged }
            }

            router.refresh()
            return { flagged: nextFlagged }
          },
          {
            optimisticData: { flagged: nextFlagged },
            populateCache: true,
            revalidate: false,
            rollbackOnError: true,
          },
        ).catch((error: unknown) => {
          toast.error(getFlagErrorMessage(error))
        })
      }}
      type="button"
      variant={flagged ? 'secondary' : 'outline'}
    >
      <Flag data-icon="inline-start" className={flagged ? 'fill-current' : undefined} />
      {flagged ? 'Flagged' : 'Flag'}
    </Button>
  )
}
