import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { z } from 'zod'

const richTextSchema = z.custom<SerializedEditorState>((value) => value != null).optional()

export const multipleChoiceAnswerMechanismSchema = z.object({
  type: z.literal('multipleChoice'),
  choices: z
    .array(
      z.object({
        id: z
          .string({
            error: 'Each multiple-choice answer must have an id.',
          })
          .min(1, {
            error: 'Each multiple-choice answer must have an id.',
          }),
        text: z.string({ error: 'Multiple-choice answers cannot be empty.' }).min(1, {
          error: 'Multiple-choice answers cannot be empty.',
        }),
      }),
      {
        error: 'Each multiple-choice answer must be valid.',
      },
    )
    .min(1, { error: 'Add at least one multiple-choice answer.' }),
  shuffle: z.boolean({ error: 'Multiple-choice configuration is incomplete.' }),
})

const selfReportAnswerMechanismSchema = z.object({
  type: z.literal('selfReport'),
})

const freeTextAnswerMechanismSchema = z.object({
  type: z.literal('freeTextValidation'),
})

export const answerMechanismSchema = z.discriminatedUnion(
  'type',
  [
    freeTextAnswerMechanismSchema,
    selfReportAnswerMechanismSchema,
    multipleChoiceAnswerMechanismSchema,
  ],
  {
    error: 'Choose an answer mechanism.',
  },
)

export const questionPartSchema = z.object({
  id: z
    .string({ error: 'Each question part must have an id.' })
    .min(1, { error: 'Each question part must have an id.' }),
  richText: richTextSchema,
  answerMechanism: answerMechanismSchema,
})

export const questionSchema = z.object({
  id: z.number({ error: 'Question must have an id.' }),
  richText: richTextSchema,
  parts: z
    .array(questionPartSchema, { error: 'Add at least one question part.' })
    .min(1, { error: 'Add at least one question part.' }),
})

export type MultipleChoiceAnswerMechanism = z.output<typeof multipleChoiceAnswerMechanismSchema>
export type AnswerMechanism = z.output<typeof answerMechanismSchema>
export type QuestionPart = z.output<typeof questionPartSchema>
export type QuestionRenderableCandidate = z.input<typeof questionSchema>

/**
 * Ready to be rendered in the UI
 */
export type Question = z.output<typeof questionSchema>
