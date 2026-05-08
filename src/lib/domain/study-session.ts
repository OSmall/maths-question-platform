import { z } from 'zod'

import type {
  RenderableQuestion,
  RenderableQuestionSubmissionEvaluation,
} from '@/lib/domain/question'

export const studySessionAnswerSchema = z.discriminatedUnion('type', [
  z.object({
    partId: z.string().min(1),
    type: z.literal('unanswered'),
  }),
  z.object({
    partId: z.string().min(1),
    type: z.literal('multipleChoice'),
    choiceId: z.string().min(1),
  }),
  z.object({
    partId: z.string().min(1),
    type: z.literal('shortText'),
    answer: z.string(),
  }),
  z.object({
    partId: z.string().min(1),
    type: z.literal('selfReport'),
    answer: z.boolean(),
  }),
])

export const studySessionQuestionSchema = z
  .object({
    id: z.string().min(1).optional(),
    index: z.number().int().nonnegative(),
    questionId: z.number().int().positive(),
    questionVersionId: z.string().min(1),
    status: z.union([z.literal('notStarted'), z.literal('skipped'), z.literal('answered')]),
    flagged: z.boolean(),
    answeredAt: z.iso.datetime().optional(),
    skippedAt: z.iso.datetime().optional(),
    answers: z.array(studySessionAnswerSchema).min(1),
  })
  .superRefine((question, ctx) => {
    if (question.status === 'answered' && !question.answeredAt) {
      ctx.addIssue({ code: 'custom', message: 'Answered questions require answeredAt.' })
    }

    if (question.status !== 'answered' && question.answeredAt) {
      ctx.addIssue({ code: 'custom', message: 'Only answered questions may have answeredAt.' })
    }

    if (question.status === 'skipped' && !question.skippedAt) {
      ctx.addIssue({ code: 'custom', message: 'Skipped questions require skippedAt.' })
    }

    if (question.status !== 'skipped' && question.skippedAt) {
      ctx.addIssue({ code: 'custom', message: 'Only skipped questions may have skippedAt.' })
    }

    if (question.status === 'answered' && question.answers.some((answer) => answer.type === 'unanswered')) {
      ctx.addIssue({ code: 'custom', message: 'Answered questions require every answer row answered.' })
    }

    if (question.status !== 'answered' && question.answers.some((answer) => answer.type !== 'unanswered')) {
      ctx.addIssue({ code: 'custom', message: 'Only answered questions may have answered rows.' })
    }
  })

export const studySessionSchema = z
  .object({
    id: z.number().int().positive(),
    state: z.union([z.literal('notStarted'), z.literal('started'), z.literal('finished')]),
    begunAt: z.iso.datetime().optional(),
    endedAt: z.iso.datetime().optional(),
    questions: z.array(studySessionQuestionSchema).min(1),
  })
  .superRefine((session, ctx) => {
    const questionIds = new Set<number>()

    session.questions.forEach((question, index) => {
      if (question.index !== index) {
        ctx.addIssue({
          code: 'custom',
          message: 'Study session question indexes must match array order.',
          path: ['questions', index, 'index'],
        })
      }

      if (questionIds.has(question.questionId)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Study sessions cannot contain duplicate questions.',
          path: ['questions', index, 'questionId'],
        })
      }
      questionIds.add(question.questionId)
    })

    if (session.state === 'finished') {
      if (!session.endedAt) {
        ctx.addIssue({ code: 'custom', message: 'Finished sessions require endedAt.' })
      }

      if (session.questions.some((question) => question.status !== 'answered')) {
        ctx.addIssue({ code: 'custom', message: 'Finished sessions require every question answered.' })
      }
    }

    if (session.state !== 'finished' && session.endedAt) {
      ctx.addIssue({ code: 'custom', message: 'Only finished sessions may have endedAt.' })
    }
  })

export type StudySessionAnswer = z.infer<typeof studySessionAnswerSchema>
export type StudySessionQuestion = z.infer<typeof studySessionQuestionSchema>
export type StudySession = z.infer<typeof studySessionSchema>

export type StudySessionQuestionRender = {
  session: Pick<StudySession, 'begunAt' | 'endedAt' | 'id' | 'state'>
  studySessionQuestion: StudySessionQuestion
  question: RenderableQuestion
  questionSubmissionEvaluation: RenderableQuestionSubmissionEvaluation
}
