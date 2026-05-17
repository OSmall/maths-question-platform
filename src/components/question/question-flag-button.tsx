'use client'

import { Flag } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import useSWR from 'swr'

import { Button } from '@/components/ui/button'

type FlagState = {
  flagged: boolean
}

type PreviewQuestionFlagButtonProps = {
  initialFlagged: boolean
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
        )
      }}
      type="button"
      variant={flagged ? 'secondary' : 'outline'}
    >
      <Flag data-icon="inline-start" className={flagged ? 'fill-current' : undefined} />
      {flagged ? 'Flagged' : 'Flag'}
    </Button>
  )
}
