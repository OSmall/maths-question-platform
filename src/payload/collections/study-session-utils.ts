type RelationshipValue =
  | number
  | string
  | {
      id?: number | string | null
    }
  | null
  | undefined

type StudySessionAnswer = {
  id?: string | null
  partId?: string | null
  type?: 'multipleChoice' | 'selfReport' | 'shortText' | 'unanswered' | null
  multipleChoice?: { choiceId?: string | null } | null
  shortText?: { answer?: string | null } | null
  selfReport?: { answer?: boolean | null } | null
}

type StudySessionQuestion = {
  id?: string | null
  question?: RelationshipValue
  questionVersionId?: string | null
  status?: 'answered' | 'notStarted' | 'skipped' | null
  flagged?: boolean | null
  answeredAt?: string | null
  skippedAt?: string | null
  answers?: StudySessionAnswer[] | null
}

export type StudySessionInput = {
  state?: 'finished' | 'notStarted' | 'started' | null
  begunAt?: string | null
  endedAt?: string | null
  questions?: StudySessionQuestion[] | null
}

export function validateStudySessionQuestionRelationship(value: unknown, data?: unknown) {
  const questionId = extractRelationshipId(value)
  if (questionId === undefined) {
    return 'Choose a question.'
  }

  const questions = Array.isArray((data as StudySessionInput | undefined)?.questions)
    ? ((data as StudySessionInput).questions ?? [])
    : []
  const questionIds = questions
    .map((question) => extractRelationshipId(question.question))
    .filter((id): id is number => typeof id === 'number')

  if (questionIds.filter((id) => id === questionId).length > 1) {
    return 'Study sessions cannot contain duplicate questions.'
  }

  return true
}

export type QuestionVersionForStudySession = {
  id: number | string
  version?: {
    parts?:
      | Array<{
          id?: string | null
        }>
      | null
  }
}

type NormalizeStudySessionInput = {
  data?: StudySessionInput
  lockQuestionVersion: (questionId: number) => Promise<QuestionVersionForStudySession>
  now?: Date
  operation: 'create' | 'update'
  originalDoc?: StudySessionInput
}

export async function normalizeStudySessionInput({
  data,
  lockQuestionVersion,
  now = new Date(),
  operation,
  originalDoc,
}: NormalizeStudySessionInput) {
  const candidate: StudySessionInput = { ...(data ?? {}) }
  const questions = Array.isArray(candidate.questions) ? candidate.questions : []

  assertUnlockedQuestionEdits({ nextQuestions: questions, originalDoc })

  if (operation === 'create') {
    candidate.state = 'started'
    candidate.begunAt = candidate.begunAt ?? now.toISOString()
    candidate.endedAt = undefined
  }

  candidate.questions = await Promise.all(
    questions.map(async (question, index) => {
      const originalQuestion = findOriginalQuestion(originalDoc?.questions ?? [], question, index)
      const shouldRelock =
        operation === 'create' ||
        questionRelationshipChanged(question, originalQuestion) ||
        !question.questionVersionId ||
        !Array.isArray(question.answers) ||
        question.answers.length === 0

      if (!shouldRelock) {
        return {
          ...question,
          flagged: question.flagged ?? false,
          status: question.status ?? 'notStarted',
        }
      }

      const questionId = extractRelationshipId(question.question)
      if (questionId === undefined) {
        return {
          ...question,
          flagged: question.flagged ?? false,
          status: question.status ?? 'notStarted',
        }
      }

      const questionVersion = await lockQuestionVersion(questionId)
      const partIds = extractQuestionPartIds(questionVersion)

      if (partIds.length === 0) {
        throw new Error(`Question ${questionId} version ${questionVersion.id} has no parts.`)
      }

      return {
        ...question,
        questionVersionId: String(questionVersion.id),
        status: 'notStarted' as const,
        flagged: question.flagged ?? false,
        answeredAt: undefined,
        skippedAt: undefined,
        answers: buildUnansweredAnswers(partIds),
      }
    }),
  )

  return candidate
}

export function extractRelationshipId(value: unknown) {
  if (typeof value === 'number' || typeof value === 'string') {
    return parsePositiveInteger(value)
  }

  if (value && typeof value === 'object' && 'id' in value) {
    const id = value.id
    if (typeof id === 'number' || typeof id === 'string') {
      return parsePositiveInteger(id)
    }
  }

  return undefined
}

export function buildUnansweredAnswers(partIds: readonly string[]): StudySessionAnswer[] {
  return partIds.map((partId) => ({
    partId,
    type: 'unanswered',
  }))
}

export function extractQuestionPartIds(questionVersion: QuestionVersionForStudySession) {
  return (questionVersion.version?.parts ?? [])
    .map((part) => part.id)
    .filter((id): id is string => typeof id === 'string' && id.length > 0)
}

function assertUnlockedQuestionEdits({
  nextQuestions,
  originalDoc,
}: {
  nextQuestions: readonly StudySessionQuestion[]
  originalDoc?: StudySessionInput
}) {
  if (!originalDoc?.questions) {
    return
  }

  if (originalDoc.state === 'finished' && questionStructureChanged(nextQuestions, originalDoc.questions)) {
    throw new Error('Finished study sessions cannot change their question list or locked versions.')
  }

  nextQuestions.forEach((question, index) => {
    const originalQuestion = findOriginalQuestion(originalDoc.questions ?? [], question, index)
    if (!originalQuestion || originalQuestion.status !== 'answered') {
      return
    }

    if (
      questionRelationshipChanged(question, originalQuestion) ||
      question.questionVersionId !== originalQuestion.questionVersionId
    ) {
      throw new Error('Answered study session questions cannot change question or version.')
    }
  })
}

function questionStructureChanged(
  nextQuestions: readonly StudySessionQuestion[],
  originalQuestions: readonly StudySessionQuestion[],
) {
  if (nextQuestions.length !== originalQuestions.length) {
    return true
  }

  return nextQuestions.some((question, index) => {
    const originalQuestion = findOriginalQuestion(originalQuestions, question, index)
    return (
      !originalQuestion ||
      questionRelationshipChanged(question, originalQuestion) ||
      question.questionVersionId !== originalQuestion.questionVersionId ||
      question.status !== originalQuestion.status ||
      question.answeredAt !== originalQuestion.answeredAt ||
      question.skippedAt !== originalQuestion.skippedAt
    )
  })
}

function findOriginalQuestion(
  originalQuestions: readonly StudySessionQuestion[],
  question: StudySessionQuestion,
  index: number,
) {
  if (question.id) {
    const originalById = originalQuestions.find((candidate) => candidate.id === question.id)
    if (originalById) {
      return originalById
    }
  }

  return originalQuestions[index]
}

function questionRelationshipChanged(
  question: StudySessionQuestion,
  originalQuestion: StudySessionQuestion | undefined,
) {
  if (!originalQuestion) {
    return true
  }

  return extractRelationshipId(question.question) !== extractRelationshipId(originalQuestion.question)
}

function parsePositiveInteger(value: number | string) {
  const parsed = typeof value === 'number' ? value : Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return undefined
  }

  return parsed
}
