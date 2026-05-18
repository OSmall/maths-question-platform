'use server'

import { redirect } from 'next/navigation'

import { actionClient } from '@/lib/safe-action'
import { buildQuestionReviewPath, submittedQuestionFormSchema } from './question-action-utils'

export const submitQuestionAnswersAction = actionClient
  .inputSchema(submittedQuestionFormSchema)
  .action(async ({ parsedInput }) => {
    redirect(
      buildQuestionReviewPath(
        parsedInput.questionId,
        parsedInput.previewStudySessionId,
        parsedInput.answers,
        { flagged: parsedInput.flagged },
      ),
    )
  })

export async function submitQuestionAnswersFormAction(formData: FormData): Promise<void> {
  await submitQuestionAnswersAction(formData)
}
