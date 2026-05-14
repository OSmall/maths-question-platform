import { err, ok, type Result } from 'neverthrow'

import {
  buildStudySessionQuestionSubmissionEvaluationCandidate,
  payloadQuestionVersionToRenderableQuestionCandidate,
  payloadStudySessionToDomainCandidate,
} from '@/lib/data/study-session-mapper'
import { renderableQuestionSchema, renderableQuestionSubmissionEvaluationSchema } from '@/lib/domain/question'
import { studySessionSchema, type StudySession } from '@/lib/domain/study-session'
import {
  QuestionNotRenderableError,
  StudySessionQuestionAlreadyAnsweredError,
  StudySessionQuestionIncompleteAnswerError,
  StudySessionQuestionIndexError,
  StudySessionUnsupportedStateError,
} from '@/lib/errors'
import {
  fetchLockedQuestionVersionByIdResult,
  fetchStudySessionByIdResult,
  updateStudySessionResult,
  type PayloadLockedQuestionVersionForService,
  type PayloadStudySessionForService,
} from '@/lib/repository/study-session-repository'
import { assertNever } from '@/lib/utils/types'
import { parseToResult } from '@/lib/utils/validation'
import type { StudySession as PayloadStudySession, User } from '@/payload/payload-types'

export type StudySessionAnswerSubmission =
  | {
      partId: string
      type: 'multipleChoice'
      choiceId: string
    }
  | {
      partId: string
      type: 'shortText'
      answer: string
    }
  | {
      partId: string
      type: 'selfReport'
      answer: boolean
    }

type MutationOptions = {
  now?: Date
  user?: User
}

type QueryOptions = {
  user?: User
}

export function getStudySessionQuestionByIndex(
  studySessionId: number,
  questionIndex: number,
  options: QueryOptions = {},
) {
  return fetchStudySessionForUser(studySessionId, options).andThen((payloadStudySession) => {
    const studySession = parsePayloadStudySession(payloadStudySession)
    const studySessionQuestion = studySession.questions[questionIndex]

    if (!studySessionQuestion) {
      return err(new StudySessionQuestionIndexError(studySessionId, questionIndex))
    }

    if (studySession.state === 'notStarted') {
      return err(new StudySessionUnsupportedStateError(studySessionId, studySession.state))
    }

    return fetchLockedQuestionVersionByIdResult(studySessionQuestion.questionVersionId).andThen(
      (payloadQuestionVersion) => {
        assertLockedQuestionVersionMatchesSessionQuestion(payloadQuestionVersion, studySessionQuestion)

        const shuffleKeyBase = `${studySessionId}:${questionIndex}:${studySessionQuestion.questionId}`
        const question = parseToResult(
          renderableQuestionSchema,
          payloadQuestionVersionToRenderableQuestionCandidate({
            index: questionIndex,
            payloadQuestionVersion,
            shuffleKeyBase,
          }),
        ).mapErr((error) => new QuestionNotRenderableError(error))

        const questionSubmissionEvaluation = parseToResult(
          renderableQuestionSubmissionEvaluationSchema,
          buildStudySessionQuestionSubmissionEvaluationCandidate({
            payloadQuestionVersion,
            studySessionQuestion,
          }),
        ).mapErr((error) => new QuestionNotRenderableError(error))

        return question.andThen((question) =>
          questionSubmissionEvaluation.map((questionSubmissionEvaluation) => ({
            session: {
              id: studySession.id,
              state: studySession.state,
              begunAt: studySession.begunAt,
              endedAt: studySession.endedAt,
            },
            studySessionQuestion,
            question,
            questionSubmissionEvaluation,
          })),
        )
      },
    )
  })
}

export function submitStudySessionQuestionAnswers(
  studySessionId: number,
  questionIndex: number,
  answers: readonly StudySessionAnswerSubmission[],
  options: MutationOptions = {},
) {
  const now = options.now ?? new Date()
  const nowIso = now.toISOString()

  return fetchStudySessionForUser(studySessionId, options).andThen((payloadStudySession) => {
    const studySession = parsePayloadStudySession(payloadStudySession)
    const studySessionQuestion = studySession.questions[questionIndex]

    if (!studySessionQuestion) {
      return err(new StudySessionQuestionIndexError(studySessionId, questionIndex))
    }

    if (studySessionQuestion.status === 'answered') {
      return err(new StudySessionQuestionAlreadyAnsweredError(studySessionId, questionIndex))
    }

    return fetchLockedQuestionVersionByIdResult(studySessionQuestion.questionVersionId).andThen(
      (payloadQuestionVersion) => {
        assertLockedQuestionVersionMatchesSessionQuestion(payloadQuestionVersion, studySessionQuestion)

        const payloadAnswersResult = buildPayloadAnswersFromSubmission(
          studySessionId,
          questionIndex,
          payloadQuestionVersion,
          answers,
        )

        if (payloadAnswersResult.isErr()) {
          return err(payloadAnswersResult.error)
        }

        const nextQuestions = payloadStudySession.questions.map((question, index) => {
          if (index !== questionIndex) {
            return question
          }

          return {
            ...question,
            status: 'answered' as const,
            answeredAt: nowIso,
            skippedAt: undefined,
            answers: payloadAnswersResult.value,
          }
        })
        const isFinished = nextQuestions.every((question) => question.status === 'answered')

        return updateStudySessionForUser(
          {
            ...payloadStudySession,
            state: isFinished ? 'finished' : 'started',
            endedAt: isFinished ? nowIso : undefined,
            questions: nextQuestions,
          },
          options,
        ).map((payloadStudySession) => parsePayloadStudySession(payloadStudySession))
      },
    )
  })
}

export function skipStudySessionQuestion(
  studySessionId: number,
  questionIndex: number,
  options: MutationOptions = {},
) {
  const now = options.now ?? new Date()
  const nowIso = now.toISOString()

  return fetchStudySessionForUser(studySessionId, options).andThen((payloadStudySession) => {
    const studySession = parsePayloadStudySession(payloadStudySession)
    const studySessionQuestion = studySession.questions[questionIndex]

    if (!studySessionQuestion) {
      return err(new StudySessionQuestionIndexError(studySessionId, questionIndex))
    }

    if (studySessionQuestion.status === 'answered') {
      return err(new StudySessionQuestionAlreadyAnsweredError(studySessionId, questionIndex))
    }

    return fetchLockedQuestionVersionByIdResult(studySessionQuestion.questionVersionId).andThen(
      (payloadQuestionVersion) => {
        assertLockedQuestionVersionMatchesSessionQuestion(payloadQuestionVersion, studySessionQuestion)

        const nextQuestions = payloadStudySession.questions.map((question, index) => {
          if (index !== questionIndex) {
            return question
          }

          return {
            ...question,
            status: 'skipped' as const,
            answeredAt: undefined,
            skippedAt: nowIso,
            answers: buildUnansweredPayloadAnswersFromQuestionVersion(payloadQuestionVersion),
          }
        })

        return updateStudySessionForUser(
          {
            ...payloadStudySession,
            state: 'started',
            endedAt: undefined,
            questions: nextQuestions,
          },
          options,
        ).map((payloadStudySession) => parsePayloadStudySession(payloadStudySession))
      },
    )
  })
}

export function setStudySessionQuestionFlagged(
  studySessionId: number,
  questionIndex: number,
  flagged: boolean,
  options: QueryOptions = {},
) {
  return fetchStudySessionForUser(studySessionId, options).andThen((payloadStudySession) => {
    const studySession = parsePayloadStudySession(payloadStudySession)

    if (!studySession.questions[questionIndex]) {
      return err(new StudySessionQuestionIndexError(studySessionId, questionIndex))
    }

    return updateStudySessionForUser(
      {
        ...payloadStudySession,
        questions: payloadStudySession.questions.map((question, index) =>
          index === questionIndex ? { ...question, flagged } : question,
        ),
      },
      options,
    ).map(
      (payloadStudySession) => parsePayloadStudySession(payloadStudySession).questions[questionIndex],
    )
  })
}

function fetchStudySessionForUser(studySessionId: number, options: QueryOptions | MutationOptions) {
  return options.user
    ? fetchStudySessionByIdResult(studySessionId, { user: options.user })
    : fetchStudySessionByIdResult(studySessionId)
}

function updateStudySessionForUser(
  studySession: PayloadStudySessionForService,
  options: QueryOptions | MutationOptions,
) {
  return options.user
    ? updateStudySessionResult(studySession, { user: options.user })
    : updateStudySessionResult(studySession)
}

function parsePayloadStudySession(payloadStudySession: PayloadStudySessionForService): StudySession {
  const candidate = payloadStudySessionToDomainCandidate(payloadStudySession)
  if (candidate.state !== 'finished') {
    candidate.endedAt = undefined
  }
  const result = parseToResult(studySessionSchema, candidate)

  if (result.isErr()) {
    throw new Error(`Corrupt study session ${payloadStudySession.id}.`, { cause: result.error })
  }

  return result.value
}

function buildPayloadAnswersFromSubmission(
  studySessionId: number,
  questionIndex: number,
  payloadQuestionVersion: PayloadLockedQuestionVersionForService,
  answers: readonly StudySessionAnswerSubmission[],
): Result<PayloadStudySession['questions'][number]['answers'], StudySessionQuestionIncompleteAnswerError> {
  const submittedAnswersByPartId = new Map<string, StudySessionAnswerSubmission>()
  const incompletePartIds: string[] = []

  answers.forEach((answer) => {
    if (submittedAnswersByPartId.has(answer.partId)) {
      throw new Error(`Duplicate submitted answer for part ${answer.partId}.`)
    }
    submittedAnswersByPartId.set(answer.partId, answer)
  })

  const payloadAnswers = payloadQuestionVersion.version.parts.map((part) => {
    if (!part.id) {
      throw new Error(`Locked question version ${payloadQuestionVersion.id} has a part without an id.`)
    }

    const answer = submittedAnswersByPartId.get(part.id)
    if (!answer) {
      incompletePartIds.push(part.id)
      return undefined
    }

    submittedAnswersByPartId.delete(part.id)

    if (answer.type !== part.response.type) {
      throw new Error(`Submitted answer for part ${part.id} has type ${answer.type}; expected ${part.response.type}.`)
    }

    const payloadAnswer = buildPayloadAnswer(part.id, answer, part)

    if (payloadAnswer === undefined) {
      incompletePartIds.push(part.id)
    }

    return payloadAnswer
  })

  if (submittedAnswersByPartId.size > 0) {
    throw new Error(
      `Submitted answers contain unknown parts: ${Array.from(submittedAnswersByPartId.keys()).join(', ')}.`,
    )
  }

  if (incompletePartIds.length > 0) {
    return err(new StudySessionQuestionIncompleteAnswerError(studySessionId, questionIndex, incompletePartIds))
  }

  return ok(payloadAnswers.filter((answer) => answer !== undefined))
}

function buildPayloadAnswer(
  partId: string,
  answer: StudySessionAnswerSubmission,
  part: PayloadLockedQuestionVersionForService['version']['parts'][number],
): PayloadStudySession['questions'][number]['answers'][number] | undefined {
  switch (answer.type) {
    case 'multipleChoice': {
      const choiceIds = new Set((part.response.multipleChoice?.choices ?? []).map((choice) => choice.id))
      if (!choiceIds.has(answer.choiceId)) {
        throw new Error(`Submitted answer for part ${partId} has invalid choice ${answer.choiceId}.`)
      }

      return {
        partId,
        type: answer.type,
        multipleChoice: {
          choiceId: answer.choiceId,
        },
      }
    }
    case 'shortText':
      if (answer.answer.trim().length === 0) {
        return undefined
      }

      return {
        partId,
        type: answer.type,
        shortText: {
          answer: answer.answer,
        },
      }
    case 'selfReport':
      return {
        partId,
        type: answer.type,
        selfReport: {
          answer: answer.answer,
        },
      }
    default:
      assertNever(answer)
  }
}

function buildUnansweredPayloadAnswersFromQuestionVersion(
  payloadQuestionVersion: PayloadLockedQuestionVersionForService,
): PayloadStudySession['questions'][number]['answers'] {
  return payloadQuestionVersion.version.parts.map((part) => {
    if (!part.id) {
      throw new Error(`Locked question version ${payloadQuestionVersion.id} has a part without an id.`)
    }

    return {
      partId: part.id,
      type: 'unanswered' as const,
    }
  })
}

function assertLockedQuestionVersionMatchesSessionQuestion(
  payloadQuestionVersion: PayloadLockedQuestionVersionForService,
  studySessionQuestion: StudySession['questions'][number],
) {
  const parentId = Number(payloadQuestionVersion.parent)

  if (!Number.isInteger(parentId) || parentId !== studySessionQuestion.questionId) {
    throw new Error(
      `Locked question version ${payloadQuestionVersion.id} does not belong to question ${studySessionQuestion.questionId}.`,
    )
  }
}
