import { ResultAsync } from 'neverthrow'
import { getPayload } from 'payload'

import { PayloadQueryError } from '@/lib/errors'
import type { UUID } from '@/lib/domain/uuid'
import { handleRepositoryError } from '@/lib/repository/repository-utils'
import { StudySession } from '@/payload/collections/study-session'
import type {
  StudySession as PayloadStudySession,
  StudySessionSelect,
  User,
} from '@/payload/payload-types'
import config from '@payload-config'

const studySessionSelect = {
  state: true,
  begunAt: true,
  endedAt: true,
  questions: {
    question: true,
    questionVersionId: true,
    status: true,
    flagged: true,
    answeredAt: true,
    skippedAt: true,
    answers: {
      partId: true,
      type: true,
      multipleChoice: {
        choiceId: true,
      },
      shortText: {
        answer: true,
      },
      selfReport: {
        answer: true,
      },
      id: true,
    },
    id: true,
  },
} as const satisfies StudySessionSelect

type UserAccessOptions = {
  user?: User
}

type PayloadStudySessionQuestionForService = Omit<
  PayloadStudySession['questions'][number],
  'answers' | 'questionVersionId'
> & {
  answers: NonNullable<PayloadStudySession['questions'][number]['answers']>
  questionVersionId: string
}

export type PayloadStudySessionForService = Pick<
  PayloadStudySession,
  'begunAt' | 'endedAt' | 'id'
> & {
  questions: PayloadStudySessionQuestionForService[]
  state: NonNullable<PayloadStudySession['state']>
}

async function queryPayloadStudySessionById(
  id: UUID,
  options: UserAccessOptions = {},
): Promise<PayloadStudySessionForService> {
  const payload = await getPayload({ config })

  const studySession = await payload.findByID({
    collection: 'studySession',
    id,
    depth: 0,
    ...(options.user ? { overrideAccess: false, user: options.user } : {}),
    select: studySessionSelect,
  })

  return studySession as PayloadStudySessionForService
}

async function queryLockedQuestionVersionById(id: string) {
  const payload = await getPayload({ config })

  return payload.findVersionByID({
    collection: 'question',
    id,
    depth: 2,
  })
}

async function updatePayloadStudySession(
  studySession: PayloadStudySessionForService,
  options: UserAccessOptions = {},
): Promise<PayloadStudySessionForService> {
  const payload = await getPayload({ config })

  const updatedStudySession = await payload.update({
    collection: 'studySession',
    id: studySession.id,
    data: {
      state: studySession.state,
      begunAt: studySession.begunAt ?? undefined,
      endedAt: studySession.endedAt ?? undefined,
      questions: studySession.questions.map((question) => ({
        id: question.id,
        question: relationshipId(question.question),
        questionVersionId: question.questionVersionId,
        status: question.status,
        flagged: question.flagged,
        answeredAt: question.answeredAt,
        skippedAt: question.skippedAt,
        answers: question.answers.map((answer) => ({
          id: answer.id,
          partId: answer.partId,
          type: answer.type,
          multipleChoice: answer.multipleChoice,
          shortText: answer.shortText,
          selfReport: answer.selfReport,
        })),
      })),
    },
    depth: 0,
    ...(options.user ? { overrideAccess: false, user: options.user } : {}),
    select: studySessionSelect,
  })

  return updatedStudySession as PayloadStudySessionForService
}

export function fetchStudySessionByIdResult(id: UUID, options: UserAccessOptions = {}) {
  return ResultAsync.fromPromise(
    queryPayloadStudySessionById(id, options),
    handleRepositoryError(StudySession.slug, id),
  )
}

export function fetchLockedQuestionVersionByIdResult(id: string) {
  return ResultAsync.fromPromise(
    queryLockedQuestionVersionById(id),
    handleRepositoryError('questionVersion', id),
  )
}

export function updateStudySessionResult(
  studySession: PayloadStudySessionForService,
  options: UserAccessOptions = {},
) {
  return ResultAsync.fromPromise(
    updatePayloadStudySession(studySession, options),
    (error) => new PayloadQueryError(error),
  )
}

export type PayloadLockedQuestionVersionForService = Awaited<
  ReturnType<typeof queryLockedQuestionVersionById>
>

function relationshipId(value: PayloadStudySessionForService['questions'][number]['question']) {
  if (typeof value === 'number' || typeof value === 'string') {
    return value
  }

  return value.id
}
