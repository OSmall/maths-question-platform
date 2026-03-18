import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { ZodError } from 'zod'
import { AlertCircleIcon } from 'lucide-react'

type QuestionPreviewWarningProps = {
  validationError: ZodError
}

export const QuestionPreviewWarning = ({ validationError }: QuestionPreviewWarningProps) => {
  return (
    <Alert className="border-border bg-card">
      <AlertCircleIcon />
      <AlertTitle>This draft is not previewable yet</AlertTitle>
      <AlertDescription>
        <div className="flex flex-col gap-3">
          <p>Finish these fields to preview the exact student-facing question.</p>
          <ul className="list-disc pl-5">
            {validationError.issues.map((issue) => (
              <li key={`${issue.path.join('-')}-${issue.message}`}>{issue.message}</li>
            ))}
          </ul>
        </div>
      </AlertDescription>
    </Alert>
  )
}
