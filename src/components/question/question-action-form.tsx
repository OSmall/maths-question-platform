'use client'

import { useTransition, type ReactNode } from 'react'
import { toast } from 'sonner'

type ActionResult = {
  data?: {
    message?: string
    status?: string
  }
  serverError?: string
}

type QuestionActionFormProps = {
  children: ReactNode
  className?: string
  skipAction?: (formData: FormData) => Promise<ActionResult | void>
  submitAction: (formData: FormData) => Promise<ActionResult | void>
}

export function QuestionActionForm({
  children,
  className,
  skipAction,
  submitAction,
}: QuestionActionFormProps) {
  const [isPending, startTransition] = useTransition()

  return (
    <form
      className={className}
      data-pending={isPending ? 'true' : undefined}
      onSubmit={(event) => {
        event.preventDefault()
        const form = event.currentTarget

        const submitter = (event.nativeEvent as SubmitEvent).submitter
        const intent = submitter instanceof HTMLButtonElement ? submitter.value : 'submit'
        const action = intent === 'skip' ? skipAction : submitAction

        if (!action) {
          return
        }

        if (intent !== 'skip' && !form.reportValidity()) {
          return
        }

        const formData = new FormData(form)
        startTransition(async () => {
          const result = await action(formData)
          const errorMessage = getActionErrorMessage(result)

          if (errorMessage) {
            toast.error(errorMessage)
          }
        })
      }}
    >
      {children}
    </form>
  )
}

function getActionErrorMessage(result: ActionResult | void) {
  if (!result) {
    return undefined
  }

  if (result.serverError) {
    return result.serverError
  }

  if (result.data?.status === 'error') {
    return result.data.message ?? 'Unable to submit question answers.'
  }

  return undefined
}
