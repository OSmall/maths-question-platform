import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { z } from 'zod'

const richTextSchema = z.custom<SerializedEditorState>((value) => value != null).optional()

const subTopicSchema = z.object({
  id: z.number({ error: 'Each subtopic must have an id.' }),
  name: z.string({ error: 'Each subtopic must have a name.' }).min(1),
  topicName: z.string({ error: 'Each subtopic must have a topic name.' }).min(1),
})

const questionWorkedSolutionSchema = z.object({
  id: z
    .string({ error: 'Each worked solution must have an id.' })
    .min(1, { error: 'Each worked solution must have an id.' }),
  prompt: z.custom<SerializedEditorState>((value) => value != null, {
    error: 'Each worked solution needs content.',
  }),
})

export const multipleChoiceResponseSchema = z.object({
  type: z.literal('multipleChoice'),
  choices: z
    .array(
      z.object({
        id: z
          .string({ error: 'Each multiple-choice answer must have an id.' })
          .min(1, { error: 'Each multiple-choice answer must have an id.' }),
        text: z.string({ error: 'Multiple-choice answers cannot be empty.' }).min(1, {
          error: 'Multiple-choice answers cannot be empty.',
        }),
      }),
      {
        error: 'Each multiple-choice answer must be valid.',
      },
    )
    .min(2, { error: 'Add at least two multiple-choice answers.' }),
  shuffle: z.boolean({ error: 'Multiple-choice configuration is incomplete.' }),
})

const selfReportResponseSchema = z.object({
  type: z.literal('selfReport'),
})

const shortTextResponseSchema = z.object({
  type: z.literal('shortText'),
})

export const questionResponseSchema = z.discriminatedUnion(
  'type',
  [shortTextResponseSchema, selfReportResponseSchema, multipleChoiceResponseSchema],
  {
    error: 'Choose a response type.',
  },
)

const reviewMultipleChoiceResponseSchema = z.object({
  type: z.literal('multipleChoice'),
  choices: z
    .array(
      z.object({
        id: z.string().min(1),
        text: z.string().min(1),
        isCorrect: z.boolean(),
      }),
    )
    .min(2),
})

const reviewShortTextResponseSchema = z.object({
  type: z.literal('shortText'),
  acceptedAnswers: z
    .array(
      z.string().min(1, {
        error: 'Short-text accepted answers cannot be empty.',
      }),
    )
    .min(1, { error: 'Add at least one accepted answer.' }),
})

const reviewSelfReportResponseSchema = z.object({
  type: z.literal('selfReport'),
})

export const reviewResponseSchema = z.discriminatedUnion('type', [
  reviewMultipleChoiceResponseSchema,
  reviewShortTextResponseSchema,
  reviewSelfReportResponseSchema,
])

export const questionPartSchema = z.object({
  id: z
    .string({ error: 'Each question part must have an id.' })
    .min(1, { error: 'Each question part must have an id.' }),
  prompt: richTextSchema,
  response: questionResponseSchema,
})

const questionReviewPartSchema = z.object({
  id: z.string().min(1),
  prompt: richTextSchema,
  response: reviewResponseSchema,
  workedSolutions: z.array(questionWorkedSolutionSchema).default([]),
})

export const questionSchema = z
  .object({
    id: z.number({ error: 'Question must have an id.' }),
    prompt: richTextSchema,
    subTopics: z.array(subTopicSchema).default([]),
    parts: z
      .array(questionPartSchema, { error: 'Add at least one question part.' })
      .min(1, { error: 'Add at least one question part.' }),
  })
  .superRefine((question, ctx) => {
    if (question.parts.length === 1 && !question.prompt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Single-part questions must use the top-level prompt.',
        path: ['prompt'],
      })
    }

    if (question.parts.length > 1) {
      question.parts.forEach((part, index) => {
        if (!part.prompt) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Multipart questions require a prompt for every part.',
            path: ['parts', index, 'prompt'],
          })
        }
      })
    }
  })

export const questionReviewSourceSchema = z.object({
  id: z.number({ error: 'Question review source must have an id.' }),
  parts: z.array(questionReviewPartSchema).min(1),
})

export type MultipleChoiceResponse = z.output<typeof multipleChoiceResponseSchema>
export type QuestionResponse = z.output<typeof questionResponseSchema>
export type QuestionPart = z.output<typeof questionPartSchema>
export type QuestionRenderableCandidate = z.input<typeof questionSchema>
export type Question = z.output<typeof questionSchema>
export type QuestionSubTopic = z.output<typeof subTopicSchema>
export type QuestionWorkedSolution = z.output<typeof questionWorkedSolutionSchema>
export type QuestionReviewSource = z.output<typeof questionReviewSourceSchema>
