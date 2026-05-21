import { z } from 'zod'

import { uuidSchema, type UUID } from '@/lib/domain/uuid'
import type { StudySessionAnswerSubmission } from '@/lib/service/study-session-service'

const answerRowFieldPattern = /^answers\.(\d+)\.(partId|type|value)$/

const answerRowSchema = z.discriminatedUnion('type', [
  z.object({
    partId: z.string().min(1),
    type: z.literal('multipleChoice'),
    value: z.string().optional(),
  }),
  z.object({
    partId: z.string().min(1),
    type: z.literal('shortText'),
    value: z.string().optional(),
  }),
  z.object({
    partId: z.string().min(1),
    type: z.literal('selfReport'),
    value: z.enum(['correct', 'incorrect']).optional(),
  }),
])

const studySessionQuestionPayloadSchema = z.object({
  questionNumber: z.number().int().positive(),
  studySessionId: uuidSchema,
})

const submittedStudySessionQuestionPayloadSchema = z
  .object({
    ...studySessionQuestionPayloadSchema.shape,
    rows: z.array(answerRowSchema).min(1),
  })
  .transform(({ rows, ...payload }) => {
    const answers: StudySessionAnswerSubmission[] = []

    for (const row of rows) {
      if (row.value === undefined || (row.type !== 'shortText' && row.value.length === 0)) {
        continue
      }

      switch (row.type) {
        case 'multipleChoice':
          answers.push({ partId: row.partId, type: row.type, choiceId: row.value })
          break
        case 'shortText':
          answers.push({ partId: row.partId, type: row.type, answer: row.value })
          break
        case 'selfReport':
          answers.push({ partId: row.partId, type: row.type, answer: row.value === 'correct' })
          break
      }

    }

    return {
      ...payload,
      answers,
    }
  })

export const studySessionQuestionFormSchema = z
  .instanceof(FormData)
  .transform((formData) => ({
    questionNumber: Number(formData.get('questionNumber')),
    studySessionId: String(formData.get('studySessionId') ?? ''),
  }))
  .pipe(studySessionQuestionPayloadSchema)

export const submittedStudySessionQuestionFormSchema = z
  .instanceof(FormData)
  .transform((formData) => ({
    questionNumber: Number(formData.get('questionNumber')),
    rows: parseAnswerRows(formData),
    studySessionId: String(formData.get('studySessionId') ?? ''),
  }))
  .pipe(submittedStudySessionQuestionPayloadSchema)

export const setStudySessionQuestionFlaggedSchema = z.object({
  flagged: z.boolean(),
  questionNumber: z.number().int().positive(),
  studySessionId: uuidSchema,
})

export function parseSubmittedStudySessionQuestionFormData(formData: FormData) {
  return submittedStudySessionQuestionFormSchema.parse(formData)
}

export function parseStudySessionQuestionFormData(formData: FormData) {
  return studySessionQuestionFormSchema.parse(formData)
}

export function buildStudySessionQuestionPath(studySessionId: UUID, questionNumber: number) {
  return `/study-session/${studySessionId}/question/${questionNumber}`
}

export function toZeroBasedQuestionIndex(questionNumber: number) {
  return questionNumber - 1
}

function parseAnswerRows(formData: FormData) {
  const rowsByIndex = new Map<number, Record<string, string>>()

  for (const [key, value] of formData.entries()) {
    if (typeof value !== 'string') {
      continue
    }

    const match = answerRowFieldPattern.exec(key)
    if (!match) {
      continue
    }

    const [, rawIndex, field] = match
    const index = Number(rawIndex)
    const row = rowsByIndex.get(index) ?? {}
    row[field] = value
    rowsByIndex.set(index, row)
  }

  return Array.from(rowsByIndex.entries())
    .sort(([leftIndex], [rightIndex]) => leftIndex - rightIndex)
    .map(([, row]) => row)
}
