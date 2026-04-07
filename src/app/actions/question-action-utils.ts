import { z } from 'zod'

const submittedQuestionPayloadSchema = z.object({
  answers: z.record(z.string(), z.string()),
  questionId: z.number().int().positive(),
  seed: z.string().min(1),
})

export const submittedQuestionFormSchema = z
  .instanceof(FormData)
  .transform((formData) => {
    const answers: Record<string, string> = {}

    for (const [key, value] of formData.entries()) {
      if (!key.startsWith('a.') || typeof value !== 'string') {
        continue
      }

      const partId = key.slice(2)
      const trimmedValue = value.trim()

      if (!partId || trimmedValue.length === 0) {
        continue
      }

      answers[partId] = value
    }

    return {
      answers,
      questionId: Number(formData.get('questionId')),
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
