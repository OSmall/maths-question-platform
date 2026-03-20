'use server'

import { draftMode } from 'next/headers'

import type {
  ReviewQuestionSubmissionRequest,
  ReviewQuestionSubmissionResult,
} from '@/lib/domain/question-review'
import { NotANumberError, PayloadQueryError, QuestionNotRenderableError } from '@/lib/errors'
import { reviewQuestionSubmissionById } from '@/lib/service/question-review-service'

export async function submitQuestionReview(
  request: ReviewQuestionSubmissionRequest,
): Promise<ReviewQuestionSubmissionResult> {
  const { isEnabled: isDraftMode } = await draftMode()
  const result = await reviewQuestionSubmissionById(request.questionId, request.responses, {
    draft: isDraftMode,
  })

  return result.match(
    (reviewPayload) => ({
      ok: true,
      reviewPayload,
    }),
    (error) => {
      if (
        error instanceof NotANumberError ||
        error instanceof QuestionNotRenderableError ||
        error instanceof PayloadQueryError
      ) {
        return {
          ok: false,
          message: error.message,
        }
      }

      return {
        ok: false,
        message: 'Unable to build review payload.',
      }
    },
  )
}
