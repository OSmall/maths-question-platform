'use server'

import { notFound, redirect } from 'next/navigation'

import { requireRole } from '@/lib/auth/protection'
import { USER_ROLES } from '@/lib/auth/roles'
import {
  NotFoundError,
  StudySessionQuestionAlreadyAnsweredError,
  StudySessionQuestionIncompleteAnswerError,
  StudySessionQuestionIndexError,
  StudySessionUnsupportedStateError,
} from '@/lib/errors'
import { actionClient } from '@/lib/safe-action'
import {
  setStudySessionQuestionFlagged,
  skipStudySessionQuestion,
  submitStudySessionQuestionAnswers,
} from '@/lib/service/study-session-service'

import {
  buildStudySessionQuestionPath,
  setStudySessionQuestionFlaggedSchema,
  studySessionQuestionFormSchema,
  submittedStudySessionQuestionFormSchema,
  toZeroBasedQuestionIndex,
} from './study-session-action-utils'

type StudySessionActionErrorCode = 'alreadyAnswered' | 'incompleteAnswers' | 'unsupportedState'

type StudySessionActionError = {
  code: StudySessionActionErrorCode
  message: string
  status: 'error'
}

export const submitStudySessionQuestionAnswersAction = actionClient
  .inputSchema(submittedStudySessionQuestionFormSchema)
  .action(async ({ parsedInput }): Promise<StudySessionActionError | never> => {
    const path = buildStudySessionQuestionPath(parsedInput.studySessionId, parsedInput.questionNumber)
    const user = await requireRole(path, USER_ROLES.student)
    const result = await submitStudySessionQuestionAnswers(
      parsedInput.studySessionId,
      toZeroBasedQuestionIndex(parsedInput.questionNumber),
      parsedInput.answers,
      { user },
    )

    if (result.isErr()) {
      return handleStudySessionActionError(result.error)
    }

    redirect(path)
  })

export async function submitStudySessionQuestionAnswersFormAction(formData: FormData): Promise<void> {
  await submitStudySessionQuestionAnswersAction(formData)
}

export const skipStudySessionQuestionAction = actionClient
  .inputSchema(studySessionQuestionFormSchema)
  .action(async ({ parsedInput }): Promise<StudySessionActionError | never> => {
    const currentPath = buildStudySessionQuestionPath(parsedInput.studySessionId, parsedInput.questionNumber)
    const user = await requireRole(currentPath, USER_ROLES.student)
    const result = await skipStudySessionQuestion(
      parsedInput.studySessionId,
      toZeroBasedQuestionIndex(parsedInput.questionNumber),
      { user },
    )

    if (result.isErr()) {
      return handleStudySessionActionError(result.error)
    }

    const nextQuestionNumber = Math.min(parsedInput.questionNumber + 1, result.value.questions.length)
    redirect(buildStudySessionQuestionPath(parsedInput.studySessionId, nextQuestionNumber))
  })

export async function skipStudySessionQuestionFormAction(formData: FormData): Promise<void> {
  await skipStudySessionQuestionAction(formData)
}

export const setStudySessionQuestionFlaggedAction = actionClient
  .inputSchema(setStudySessionQuestionFlaggedSchema)
  .action(async ({ parsedInput }) => {
    const path = buildStudySessionQuestionPath(parsedInput.studySessionId, parsedInput.questionNumber)
    const user = await requireRole(path, USER_ROLES.student)
    const result = await setStudySessionQuestionFlagged(
      parsedInput.studySessionId,
      toZeroBasedQuestionIndex(parsedInput.questionNumber),
      parsedInput.flagged,
      { user },
    )

    if (result.isErr()) {
      return handleStudySessionActionError(result.error)
    }

    return { flagged: result.value.flagged }
  })

function handleStudySessionActionError(error: Error): StudySessionActionError {
  if (error instanceof NotFoundError || error instanceof StudySessionQuestionIndexError) {
    notFound()
  }

  if (error instanceof StudySessionQuestionAlreadyAnsweredError) {
    return {
      code: 'alreadyAnswered',
      message: 'This question has already been answered. Refresh the page to review the saved answer.',
      status: 'error',
    }
  }

  if (error instanceof StudySessionQuestionIncompleteAnswerError) {
    return {
      code: 'incompleteAnswers',
      message: 'Answer every required part before submitting.',
      status: 'error',
    }
  }

  if (error instanceof StudySessionUnsupportedStateError) {
    return {
      code: 'unsupportedState',
      message: 'This study session has not been started yet.',
      status: 'error',
    }
  }

  throw error
}
