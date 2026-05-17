'use client'

import { CheckCircle2 } from 'lucide-react'
import { useFormStatus } from 'react-dom'

import { cn } from '@/lib/utils'

type QuestionSubmitButtonProps = {
  className?: string
  disabled?: boolean
}

export const QuestionSubmitButton = ({ className, disabled }: QuestionSubmitButtonProps) => {
  const { pending } = useFormStatus()

  return (
    <button
      className={cn(
        'inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-transparent bg-primary px-5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/80 disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      disabled={disabled || pending}
      type="submit"
    >
      <CheckCircle2 className="size-4" />
      {pending ? 'Checking answer...' : 'Check answer'}
    </button>
  )
}
