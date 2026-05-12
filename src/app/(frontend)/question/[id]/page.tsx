import { RefreshRouteOnSave } from '@/components/live-preview/refresh-route-on-save'
import { QuestionPreviewWarning } from '@/components/question/question-preview-warning'
import { QuestionRenderer } from '@/components/question/question-renderer'
import { QuestionNotRenderableError } from '@/lib/errors'
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

  const questionId = Number(id)
  if (isNaN(questionId)) {
    console.warn(`Question id [${id}] is not a number, redirecting to Not Found page`)
    notFound()
  }

  await requireRole(buildQuestionPath(id, resolvedSearchParams), USER_ROLES.admin)

  const seed = getSingleSearchParam(resolvedSearchParams.seed)
  if (!seed) {
    const seededSearchParams = new URLSearchParams()

    for (const [key, value] of Object.entries(resolvedSearchParams)) {
      if (Array.isArray(value)) {
        value.forEach((entry) => seededSearchParams.append(key, entry))
      } else if (value != null) {
        seededSearchParams.set(key, value)
      }
    }

    seededSearchParams.set('seed', crypto.randomUUID())
    redirect(`/question/${id}?${seededSearchParams.toString()}`)
  }

  const questionResult = await getQuestionById(questionId, { draft: isDraftMode, shuffleKeyBase: seed })
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
            isDraftMode={isDraftMode}
            question={question}
            questionSubmissionEvaluation={questionSubmissionEvaluation}
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
