'use client'

import { Bookmark, Flag } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/lib/utils'

type QuestionToggleButtonProps = {
  activeClassName?: string
  activeLabel: string
  className?: string
  icon: 'bookmark' | 'flag'
  inactiveClassName?: string
  inactiveLabel: string
}

export const QuestionToggleButton = ({
  activeClassName,
  activeLabel,
  className,
  icon,
  inactiveClassName,
  inactiveLabel,
}: QuestionToggleButtonProps) => {
  const [isActive, setIsActive] = useState(false)

  const Icon = icon === 'flag' ? Flag : Bookmark

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-all',
        isActive
          ? activeClassName
          : (inactiveClassName ??
              'border-border/70 bg-background/70 text-muted-foreground hover:text-foreground'),
        className,
      )}
      onClick={() => setIsActive((current) => !current)}
      type="button"
    >
      <Icon className={cn('size-4', isActive && 'fill-current')} />
      {isActive ? activeLabel : inactiveLabel}
    </button>
  )
}
