import { hasText } from '@payloadcms/richtext-lexical/shared'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { z } from 'zod'

const richTextSchema = z.custom<SerializedEditorState>((value) => value != null).optional()

const subTopicSchema = z.object({
  id: z.number(),
  subtopicName: z.string().min(1),
  topicName: z.string().min(1),
})

const renderableQuestionPartSchema = z.object({
  id: z.string().min(1),
  partNumber: z.number().int().positive(),
  prompt: richTextSchema,
  response: questionResponseDiscriminatedUnion({
    multipleChoice: {
      choices: z.record(
        z.string(), // choice id
        z.object({
          id: z.string(), // also choice id
          text: z.string().min(1),
        }),
      ),
      shuffle: z.boolean(),
    },
  }),
})

export const renderableQuestionSchema = z
  .object({
    index: z.number().int().positive(), // one-based display number within the list of questions
    id: z.number(), // globally unique identifier
    version: z.string().min(1),
    prompt: richTextSchema,
    subTopics: z.array(subTopicSchema),
    shuffleKeyBase: z.string(), // used for predictable randomness i.e. shuffling multiple-choice choices
    parts: z.array(renderableQuestionPartSchema).min(1),
  })
  .superRefine((question, ctx) => {
    question.parts.forEach((part, index) => {
      if (part.partNumber !== index + 1) {
        ctx.addIssue({
          code: 'custom',
          message: 'Renderable question part numbers must match display order.',
          path: ['parts', index, 'partNumber'],
        })
      }
    })

    if (question.parts.length === 1 && !hasText(question.prompt)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Single-part questions must use the top-level prompt.',
        path: ['prompt'],
      })
    }

    if (question.parts.length > 1) {
      question.parts.forEach((part, index) => {
        if (!hasText(part.prompt)) {
          ctx.addIssue({
            code: 'custom',
            message: 'Multipart questions require a prompt for every part.',
            path: ['parts', index, 'prompt'],
          })
        }
      })
    }
  })

const questionWorkedSolutionSchema = z.object({
  id: z
    .string({ error: 'Each worked solution must have an id.' })
    .min(1, { error: 'Each worked solution must have an id.' }),
  prompt: z.custom<SerializedEditorState>((value) => value != null, {
    error: 'Each worked solution needs content.',
  }),
})

const renderableQuestionSubmissionEvaluatedPartSchema = questionResponseDiscriminatedUnion(
  // todo: rename to `renderableQuestionAttemptSchema` and flow through
  {
    shortText: { givenResponse: z.string(), correctResponses: z.array(z.string()).min(1) },
    selfReport: { givenResponse: z.boolean() },
    multipleChoice: {
      givenChoiceId: z.string(),
      correctChoiceId: z.string(),
    },
  },
  {
    isCorrect: z.boolean(),
    workedSolutions: z.array(questionWorkedSolutionSchema),
  },
)

const renderableQuestionSubmissionEvaluatedPartRecordSchema = z.record(
  z.string(),
  renderableQuestionSubmissionEvaluatedPartSchema,
)

const renderableQuestionSubmissionUnevaluatedPartRecordSchema = z.record(
  z.string(),
  questionResponseDiscriminatedUnion({
    shortText: { givenResponse: z.string().optional() },
    selfReport: { givenResponse: z.boolean().optional() },
    multipleChoice: { givenChoiceId: z.string().optional() },
  }),
)

/**
 * Represents the question evaluation data sent to the UI
 */
export const renderableQuestionSubmissionEvaluationSchema = z.discriminatedUnion('isEvaluated', [
  z.object({
    isEvaluated: z.literal(true), // student has submitted the question for evaluation. All parts have an answer
    answeredParts: z.number(),
    correctParts: z.number(),
    incorrectParts: z.number(),
    parts: renderableQuestionSubmissionEvaluatedPartRecordSchema,
  }),
  z.object({
    isEvaluated: z.literal(false),
    answeredParts: z.number(),
    parts: renderableQuestionSubmissionUnevaluatedPartRecordSchema,
  }),
])

export const questionResponseTypeSchema = z.union([
  z.literal('shortText'),
  z.literal('selfReport'),
  z.literal('multipleChoice'),
])
export type QuestionPartResponseType = z.infer<typeof questionResponseTypeSchema>
type QuestionPartResponseShapeMap = {
  [K in QuestionPartResponseType]: z.ZodRawShape
}

/**
 * Look up the extra Zod shape for a specific response type, defaulting to an empty shape when none was provided.
 */
type ShapeFor<
  TExtraByType extends Partial<QuestionPartResponseShapeMap>,
  TType extends QuestionPartResponseType,
> = TType extends keyof TExtraByType ? Extract<TExtraByType[TType], z.ZodRawShape> : {}

/**
 * Create a discriminated union on the {@link QuestionPartResponseType} with the `type` field already filled.
 * Takes extra fields for each response type and optional fields shared by every variant.
 */
function questionResponseDiscriminatedUnion<
  TExtraByType extends Partial<QuestionPartResponseShapeMap> = {},
  TCommonShape extends z.ZodRawShape = {},
>(extraByType?: TExtraByType, commonShape?: TCommonShape) {
  const extra = (extraByType ?? {}) as TExtraByType
  const common = (commonShape ?? {}) as TCommonShape

  const schemas = {
    shortText: z.object({
      ...common,
      ...((extra.shortText ?? {}) as ShapeFor<TExtraByType, 'shortText'>),
      type: z.literal('shortText'),
    }),
    selfReport: z.object({
      ...common,
      ...((extra.selfReport ?? {}) as ShapeFor<TExtraByType, 'selfReport'>),
      type: z.literal('selfReport'),
    }),
    multipleChoice: z.object({
      ...common,
      ...((extra.multipleChoice ?? {}) as ShapeFor<TExtraByType, 'multipleChoice'>),
      type: z.literal('multipleChoice'),
    }),
  } satisfies Record<QuestionPartResponseType, z.ZodTypeAny>

  return z.discriminatedUnion('type', [
    schemas.shortText,
    schemas.selfReport,
    schemas.multipleChoice,
  ])
}

export type RenderableQuestion = z.infer<typeof renderableQuestionSchema>
export type RenderableQuestionPart = z.infer<typeof renderableQuestionPartSchema>

export type RenderableQuestionSubmissionEvaluation = z.infer<
  typeof renderableQuestionSubmissionEvaluationSchema
>
export type RenderableQuestionSubmissionEvaluatedPart = z.infer<
  typeof renderableQuestionSubmissionEvaluatedPartSchema
>
export type RenderableQuestionSubmissionEvaluatedPartRecord = z.infer<
  typeof renderableQuestionSubmissionEvaluatedPartRecordSchema
>
