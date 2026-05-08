import { describe, expect, it } from 'bun:test'

import { renderableQuestionSchema } from '@/lib/domain/question'

const emptyRichText = {
  root: {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        version: 1,
        children: [],
        direction: 'ltr',
        format: '',
        indent: 0,
      },
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  },
}

const nonEmptyRichText = {
  root: {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        version: 1,
        children: [
          {
            type: 'text',
            version: 1,
            text: 'Prompt text',
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
      },
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  },
}

describe('renderableQuestionSchema prompt validation', () => {
  it('requires a non-empty top-level prompt for single-part questions', () => {
    const result = renderableQuestionSchema.safeParse(
      createQuestion({ prompt: emptyRichText, parts: [createPart({ prompt: undefined })] }),
    )

    expect(result.success).toBe(false)

    if (result.success) {
      throw new Error('Expected validation to fail')
    }

    expect(result.error.issues).toContainEqual(
      expect.objectContaining({
        message: 'Single-part questions must use the top-level prompt.',
        path: ['prompt'],
      }),
    )
  })

  it('accepts multipart questions when every part prompt has text', () => {
    const result = renderableQuestionSchema.safeParse(
      createQuestion({
        prompt: undefined,
        parts: [
          createPart({ id: 'part-1', prompt: nonEmptyRichText }),
          createPart({ id: 'part-2', prompt: nonEmptyRichText }),
        ],
      }),
    )

    expect(result.success).toBe(true)
  })

  it('rejects multipart questions when any part prompt is empty rich text', () => {
    const result = renderableQuestionSchema.safeParse(
      createQuestion({
        prompt: undefined,
        parts: [
          createPart({ id: 'part-1', prompt: nonEmptyRichText }),
          createPart({ id: 'part-2', prompt: emptyRichText }),
        ],
      }),
    )

    expect(result.success).toBe(false)

    if (result.success) {
      throw new Error('Expected validation to fail')
    }

    expect(result.error.issues).toContainEqual(
      expect.objectContaining({
        message: 'Multipart questions require a prompt for every part.',
        path: ['parts', 1, 'prompt'],
      }),
    )
  })
})

function createQuestion(overrides?: {
  prompt?: typeof nonEmptyRichText | undefined
  parts?: Array<ReturnType<typeof createPart>>
}) {
  return {
    index: 0,
    id: 1,
    version: 'version-1',
    prompt: overrides?.prompt ?? nonEmptyRichText,
    subTopics: [],
    shuffleKeyBase: 'seed',
    parts: overrides?.parts ?? [createPart()],
  }
}

function createPart(overrides?: { id?: string; prompt?: typeof nonEmptyRichText | undefined }) {
  return {
    id: overrides?.id ?? 'part-1',
    prompt: overrides?.prompt,
    response: {
      type: 'selfReport' as const,
    },
  }
}
