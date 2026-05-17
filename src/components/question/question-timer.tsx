'use client'

import { Clock3 } from 'lucide-react'
import { useEffect, useState } from 'react'

type QuestionTimerProps = {
  begunAt?: string
  endedAt?: string
}

export function QuestionTimer({ begunAt, endedAt }: QuestionTimerProps) {
  const [now, setNow] = useState(() => Date.now())
  const isFrozen = endedAt !== undefined || begunAt === undefined

  useEffect(() => {
    if (isFrozen) {
      return undefined
    }

    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [isFrozen])

  return (
    <span className="inline-flex items-center gap-2 tabular-nums">
      <Clock3 className="size-4" />
      {formatElapsedTime(begunAt, endedAt, now)}
    </span>
  )
}

function formatElapsedTime(begunAt: string | undefined, endedAt: string | undefined, now: number) {
  if (!begunAt) {
    return '0:00'
  }

  const startTime = new Date(begunAt).getTime()
  const endTime = endedAt ? new Date(endedAt).getTime() : now
  const totalSeconds = Math.max(0, Math.floor((endTime - startTime) / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = String(totalSeconds % 60).padStart(2, '0')

  return `${minutes}:${seconds}`
}
