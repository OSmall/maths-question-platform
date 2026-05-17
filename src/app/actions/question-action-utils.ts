import { z } from 'zod'

const answerRowFieldPattern = /^answers\.(\d+)\.(partId|type|value)$/

const answerRowSchema = z.object({
  partId: z.string().min(1),
  type: z.union([z.literal('multipleChoice'), z.literal('shortText'), z.literal('selfReport')]),
  value: z.string().min(1),
})

const submittedQuestionPayloadSchema = z.object({
  rows: z.array(answerRowSchema),
  questionId: z.number().int().positive(),
  seed: z.string().min(1),
}).transform(({ rows, ...payload }) => ({
  ...payload,
  answers: Object.fromEntries(rows.map((row) => [row.partId, row.value])),
}))

export const submittedQuestionFormSchema = z
  .instanceof(FormData)
  .transform((formData) => {
    return {
      questionId: Number(formData.get('questionId')),
      rows: parseAnswerRows(formData),
      seed: String(formData.get('seed') ?? ''),
    }
  })
  .pipe(submittedQuestionPayloadSchema)

export function parseSubmittedQuestionFormData(formData: FormData) {
  return submittedQuestionFormSchema.parse(formData)
}

export function buildQuestionReviewPath(
  questionId: number,
  seed: string,
  answers: Record<string, string>,
) {
  const searchParams = new URLSearchParams({
    seed,
    submitted: '1',
  })

  for (const [partId, answer] of Object.entries(answers)) {
    searchParams.set(`a.${partId}`, answer)
  }

  return `/question/${questionId}?${searchParams.toString()}`
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
