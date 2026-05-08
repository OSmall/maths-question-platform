import { err } from 'neverthrow'

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
import type { StudySession as PayloadStudySession } from '@/payload/payload-types'

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
}

export function getStudySessionQuestionByIndex(studySessionId: number, questionIndex: number) {
  return fetchStudySessionByIdResult(studySessionId).andThen((payloadStudySession) => {
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

  return fetchStudySessionByIdResult(studySessionId).andThen((payloadStudySession) => {
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
            status: 'answered' as const,
            answeredAt: nowIso,
            skippedAt: undefined,
            answers: buildPayloadAnswersFromSubmission(payloadQuestionVersion, answers),
          }
        })
        const isFinished = nextQuestions.every((question) => question.status === 'answered')

        return updateStudySessionResult({
          ...payloadStudySession,
          state: isFinished ? 'finished' : 'started',
          endedAt: isFinished ? nowIso : undefined,
          questions: nextQuestions,
        }).map((payloadStudySession) => parsePayloadStudySession(payloadStudySession))
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

  return fetchStudySessionByIdResult(studySessionId).andThen((payloadStudySession) => {
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

        return updateStudySessionResult({
          ...payloadStudySession,
          state: 'started',
          endedAt: undefined,
          questions: nextQuestions,
        }).map((payloadStudySession) => parsePayloadStudySession(payloadStudySession))
      },
    )
  })
}

export function setStudySessionQuestionFlagged(
  studySessionId: number,
  questionIndex: number,
  flagged: boolean,
) {
  return fetchStudySessionByIdResult(studySessionId).andThen((payloadStudySession) => {
    const studySession = parsePayloadStudySession(payloadStudySession)

    if (!studySession.questions[questionIndex]) {
      return err(new StudySessionQuestionIndexError(studySessionId, questionIndex))
    }

    return updateStudySessionResult({
      ...payloadStudySession,
      questions: payloadStudySession.questions.map((question, index) =>
        index === questionIndex ? { ...question, flagged } : question,
      ),
    }).map((payloadStudySession) => parsePayloadStudySession(payloadStudySession).questions[questionIndex])
  })
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
  payloadQuestionVersion: PayloadLockedQuestionVersionForService,
  answers: readonly StudySessionAnswerSubmission[],
): PayloadStudySession['questions'][number]['answers'] {
  const submittedAnswersByPartId = new Map<string, StudySessionAnswerSubmission>()

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
      throw new Error(`Submitted answers are missing required part ${part.id}.`)
    }

    submittedAnswersByPartId.delete(part.id)

    if (answer.type !== part.response.type) {
      throw new Error(`Submitted answer for part ${part.id} has type ${answer.type}; expected ${part.response.type}.`)
    }

    return buildPayloadAnswer(part.id, answer, part)
  })

  if (submittedAnswersByPartId.size > 0) {
    throw new Error(
      `Submitted answers contain unknown parts: ${Array.from(submittedAnswersByPartId.keys()).join(', ')}.`,
    )
  }

  return payloadAnswers
}

function buildPayloadAnswer(
  partId: string,
  answer: StudySessionAnswerSubmission,
  part: PayloadLockedQuestionVersionForService['version']['parts'][number],
): PayloadStudySession['questions'][number]['answers'][number] {
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
      if (answer.answer.length === 0) {
        throw new Error(`Submitted answer for part ${partId} is empty.`)
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
