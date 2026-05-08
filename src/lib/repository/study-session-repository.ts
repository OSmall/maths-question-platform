import { ResultAsync } from 'neverthrow'
import { getPayload } from 'payload'

import { PayloadQueryError } from '@/lib/errors'
import { handleRepositoryError } from '@/lib/repository/repository-utils'
import { StudySession } from '@/payload/collections/study-session'
import type { QuestionSelect, StudySessionSelect } from '@/payload/payload-types'
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

const lockedQuestionVersionSelect = {
  prompt: true,
  subTopics: true,
  parts: {
    id: true,
    prompt: true,
    response: {
      type: true,
      multipleChoice: {
        choices: {
          id: true,
          text: true,
          isCorrect: true,
        },
        shuffle: true,
      },
      shortText: {
        acceptedAnswers: {
          id: true,
          value: true,
        },
      },
      selfReport: {},
    },
    workedSolutions: {
      id: true,
      prompt: true,
    },
  },
} as const satisfies QuestionSelect

async function queryPayloadStudySessionById(id: number) {
  const payload = await getPayload({ config })

  return payload.findByID({
    collection: 'studySession',
    id,
    depth: 0,
    select: studySessionSelect,
  })
}

async function queryLockedQuestionVersionById(id: string) {
  const payload = await getPayload({ config })

  return payload.findVersionByID({
    collection: 'question',
    id,
    depth: 2,
    select: lockedQuestionVersionSelect,
  })
}

async function updatePayloadStudySession(studySession: PayloadStudySessionForService) {
  const payload = await getPayload({ config })

  return payload.update({
    collection: 'studySession',
    id: studySession.id,
    data: {
      state: studySession.state,
      begunAt: studySession.begunAt ?? undefined,
      endedAt: studySession.endedAt ?? undefined,
      questions: studySession.questions.map((question) => ({
        id: question.id ?? undefined,
        question: relationshipId(question.question),
        questionVersionId: question.questionVersionId,
        status: question.status,
        flagged: question.flagged,
        answeredAt: question.answeredAt ?? undefined,
        skippedAt: question.skippedAt ?? undefined,
        answers: question.answers.map((answer) => ({
          id: answer.id ?? undefined,
          partId: answer.partId,
          type: answer.type,
          multipleChoice: answer.multipleChoice,
          shortText: answer.shortText,
          selfReport: answer.selfReport,
        })),
      })),
    },
    depth: 0,
    select: studySessionSelect,
  })
}

export function fetchStudySessionByIdResult(id: number) {
  return ResultAsync.fromPromise(
    queryPayloadStudySessionById(id),
    handleRepositoryError(StudySession.slug, id),
  )
}

export function fetchLockedQuestionVersionByIdResult(id: string) {
  return ResultAsync.fromPromise(
    queryLockedQuestionVersionById(id),
    handleRepositoryError('questionVersion', id),
  )
}

export function updateStudySessionResult(studySession: PayloadStudySessionForService) {
  return ResultAsync.fromPromise(updatePayloadStudySession(studySession), (error) => new PayloadQueryError(error))
}

export type PayloadStudySessionForService = Awaited<ReturnType<typeof queryPayloadStudySessionById>>
export type PayloadLockedQuestionVersionForService = Awaited<
  ReturnType<typeof queryLockedQuestionVersionById>
>

function relationshipId(value: PayloadStudySessionForService['questions'][number]['question']) {
  if (typeof value === 'number') {
    return value
  }

  return value.id
}
