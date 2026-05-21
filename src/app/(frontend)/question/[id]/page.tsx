import { RefreshRouteOnSave } from '@/components/live-preview/refresh-route-on-save'
import { submitQuestionAnswersAction } from '@/app/actions/question-actions'
import { PreviewQuestionFlagButton } from '@/components/question/question-flag-button'
import { QuestionPreviewWarning } from '@/components/question/question-preview-warning'
import { QuestionRenderer } from '@/components/question/question-renderer'
import { QuestionNotRenderableError } from '@/lib/errors'
import { parseUUIDToResult, randomUUIDv7 } from '@/lib/domain/uuid'
import { getQuestionSubmissionEvaluation } from '@/lib/service/question-evaluation-service'
import { getQuestionById } from '@/lib/service/question-service'
import { USER_ROLES } from '@/lib/auth/roles'
import { requireRole } from '@/lib/auth/protection'
import { getSingleSearchParam } from '@/lib/utils/search-params'
import { Result } from 'neverthrow'
import { draftMode } from 'next/headers'
import { notFound, redirect } from 'next/navigation'

type QuestionPageProps = {
  params: Promise<{
    id: string
  }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function QuestionPage({
  params,
  searchParams, // only using searchParams for now as a POC to replicate persistence until the "StudySession" collection is implemented
}: QuestionPageProps) {
  const [{ id }, resolvedSearchParams, { isEnabled: isDraftMode }] = await Promise.all([
    params,
    searchParams,
    draftMode(),
  ])

  const questionIdResult = parseUUIDToResult(id)
  if (questionIdResult.isErr()) {
    notFound()
  }
  const questionId = questionIdResult.value

  await requireRole(buildQuestionPath(id, resolvedSearchParams), USER_ROLES.admin)

  const previewStudySessionId = getSingleSearchParam(resolvedSearchParams.previewStudySessionId)
  const isFlagged = getSingleSearchParam(resolvedSearchParams.flagged) === '1'
  const isSubmitted = getSingleSearchParam(resolvedSearchParams.submitted) === '1'
  if (!previewStudySessionId || getSingleSearchParam(resolvedSearchParams.seed)) {
    const previewSearchParams = new URLSearchParams()

    for (const [key, value] of Object.entries(resolvedSearchParams)) {
      if (Array.isArray(value)) {
        value.forEach((entry) => previewSearchParams.append(key, entry))
      } else if (value != null) {
        previewSearchParams.set(key, value)
      }
    }

    previewSearchParams.delete('seed')
    previewSearchParams.set('previewStudySessionId', previewStudySessionId ?? randomUUIDv7())
    redirect(`/question/${id}?${previewSearchParams.toString()}`)
  }

  const shuffleKeyBase = `${previewStudySessionId}:0:${questionId}`
  const questionResult = await getQuestionById(questionId, {
    draft: isDraftMode,
    shuffleKeyBase,
  })
  const questionSubmissionEvaluationResult = await getQuestionSubmissionEvaluation(
    questionId,
    resolvedSearchParams,
    { draft: isDraftMode },
  )

  return Result.combine([questionResult, questionSubmissionEvaluationResult]).match(
    ([question, questionSubmissionEvaluation]) => (
      <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.16),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.94))] px-4 py-5 dark:bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.14),transparent_28%),linear-gradient(180deg,rgba(12,18,24,0.98),rgba(15,23,42,0.96))] md:px-6 md:py-8">
        {isDraftMode && <RefreshRouteOnSave />}
        <div className="mx-auto flex w-full justify-center">
          <QuestionRenderer
            flagControl={<PreviewQuestionFlagButton initialFlagged={isFlagged} />}
            isDraftMode={isDraftMode}
            isQuestionFlagged={isFlagged}
            question={question}
            questionSubmissionEvaluation={questionSubmissionEvaluation}
            routeFields={[
              { name: 'questionId', value: question.id },
              { name: 'previewStudySessionId', value: previewStudySessionId },
              ...(isFlagged ? [{ name: 'flagged', value: '1' }] : []),
            ]}
            submitAction={submitQuestionAnswersAction}
            timer={buildPreviewTimer(isSubmitted)}
          />
        </div>
      </div>
    ),
    (err) => {
      if (isDraftMode && err instanceof QuestionNotRenderableError) {
        return (
          <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center px-4 py-8 md:px-6 md:py-10">
            <RefreshRouteOnSave />
            <div className="w-full max-w-3xl">
              <QuestionPreviewWarning validationError={err.validationError} />
            </div>
          </div>
        )
      }

      console.warn(
        `Cannot fetch Question entity due to ${err.name}, redirecting to Not Found page`,
        err,
      )
      notFound()
    },
  )
}

function buildPreviewTimer(isSubmitted: boolean) {
  const now = new Date().toISOString()
  return isSubmitted ? { begunAt: now, endedAt: now } : { begunAt: now }
}

function buildQuestionPath(id: string, searchParams: Record<string, string | string[] | undefined>) {
  const serializedSearchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      value.forEach((entry) => serializedSearchParams.append(key, entry))
    } else if (value != null) {
      serializedSearchParams.set(key, value)
    }
  }

  const queryString = serializedSearchParams.toString()
  return queryString ? `/question/${id}?${queryString}` : `/question/${id}`
}
