import { notFound } from 'next/navigation'

import {
  setStudySessionQuestionFlaggedAction,
  skipStudySessionQuestionAction,
  submitStudySessionQuestionAnswersAction,
} from '@/app/actions/study-session-actions'
import { buildStudySessionQuestionPath } from '@/app/actions/study-session-action-utils'
import { StudySessionQuestionFlagButton } from '@/components/question/question-flag-button'
import { QuestionRenderer } from '@/components/question/question-renderer'
import { requireRole } from '@/lib/auth/protection'
import { USER_ROLES } from '@/lib/auth/roles'
import {
  NotFoundError,
  QuestionNotRenderableError,
  StudySessionQuestionIndexError,
  StudySessionUnsupportedStateError,
} from '@/lib/errors'
import { parseUUIDToResult } from '@/lib/domain/uuid'
import { getStudySessionQuestionByIndex } from '@/lib/service/study-session-service'

type StudySessionQuestionPageProps = {
  params: Promise<{
    questionIndex: string
    studySessionId: string
  }>
}

export default async function StudySessionQuestionPage({ params }: StudySessionQuestionPageProps) {
  const { questionIndex, studySessionId } = await params
  const studySessionIdResult = parseUUIDToResult(studySessionId)
  const questionNumber = parsePositiveInteger(questionIndex)

  if (studySessionIdResult.isErr() || questionNumber == null) {
    notFound()
  }
  const studySessionUUID = studySessionIdResult.value

  const path = buildStudySessionQuestionPath(studySessionUUID, questionNumber)
  const user = await requireRole(path, USER_ROLES.student)
  const questionIndexZeroBased = questionNumber - 1
  const result = await getStudySessionQuestionByIndex(studySessionUUID, questionIndexZeroBased, {
    user,
  })

  return result.match(
    ({ question, questionSubmissionEvaluation, session, studySessionQuestion }) => {
      const nextQuestionNumber = questionNumber + 1
      const continueHref =
        nextQuestionNumber <= session.questionCount
          ? buildStudySessionQuestionPath(studySessionUUID, nextQuestionNumber)
          : undefined
      const isAnswered = studySessionQuestion.status === 'answered'

      return (
        <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.16),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.94))] px-4 py-5 dark:bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.14),transparent_28%),linear-gradient(180deg,rgba(12,18,24,0.98),rgba(15,23,42,0.96))] md:px-6 md:py-8">
          <div className="mx-auto flex w-full justify-center">
            <QuestionRenderer
              controls={{
                continue: { href: continueHref },
                skip: { disabled: isAnswered },
              }}
              flagControl={
                <StudySessionQuestionFlagButton
                  initialFlagged={studySessionQuestion.flagged}
                  questionNumber={questionNumber}
                  setFlaggedAction={setStudySessionQuestionFlaggedAction}
                  studySessionId={studySessionUUID}
                />
              }
              isDraftMode={false}
              isQuestionFlagged={studySessionQuestion.flagged}
              question={question}
              questionSubmissionEvaluation={questionSubmissionEvaluation}
              routeFields={[
                { name: 'studySessionId', value: studySessionUUID },
                { name: 'questionNumber', value: questionNumber },
              ]}
              skipAction={skipStudySessionQuestionAction}
              submitAction={submitStudySessionQuestionAnswersAction}
              timer={{ begunAt: session.begunAt, endedAt: session.endedAt }}
            />
          </div>
        </div>
      )
    },
    (error) => {
      if (error instanceof StudySessionUnsupportedStateError) {
        return <UnsupportedStudySessionMessage />
      }

      if (
        error instanceof NotFoundError ||
        error instanceof StudySessionQuestionIndexError ||
        error instanceof QuestionNotRenderableError
      ) {
        notFound()
      }

      throw error
    },
  )
}

function parsePositiveInteger(value: string) {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return undefined
  }

  return parsed
}

function UnsupportedStudySessionMessage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="max-w-xl rounded-[2rem] border border-border/70 bg-card p-6 text-center shadow-[0_20px_50px_-30px_rgba(15,23,42,0.35)] sm:p-8">
        <p className="text-sm font-semibold tracking-[0.16em] text-muted-foreground uppercase">
          Study session not started
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
          This study session cannot be opened yet.
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Starting sessions from this route is not supported yet. Please return once the session has
          been started.
        </p>
      </div>
    </main>
  )
}
