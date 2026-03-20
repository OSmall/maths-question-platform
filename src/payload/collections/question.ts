import type { CollectionConfig, Field } from 'payload'

type MultipleChoiceChoice = {
  isCorrect?: boolean | null
  text?: string | null
}

type ShortTextAcceptedAnswer = {
  value?: string | null
}

type ResponseGroupValue = {
  type?: 'multipleChoice' | 'selfReport' | 'shortText' | null
  multipleChoice?: {
    choices?: MultipleChoiceChoice[] | null
    shuffle?: boolean | null
  } | null
  selfReport?: Record<string, never> | null
  shortText?: {
    acceptedAnswers?: ShortTextAcceptedAnswer[] | null
  } | null
}

const normalizeSimpleString = (value: string) => value.trim().replace(/\s+/g, ' ')

function hasMeaningfulRichTextContent(value: unknown): boolean {
  if (!value || typeof value !== 'object') {
    return false
  }

  if (Array.isArray(value)) {
    return value.some(hasMeaningfulRichTextContent)
  }

  if ('text' in value && typeof value.text === 'string' && value.text.trim().length > 0) {
    return true
  }

  if (
    'type' in value &&
    typeof value.type === 'string' &&
    value.type !== 'root' &&
    value.type !== 'paragraph'
  ) {
    return true
  }

  if ('children' in value && Array.isArray(value.children)) {
    return value.children.some(hasMeaningfulRichTextContent)
  }

  return false
}

function getPartCount(data: unknown) {
  if (!data || typeof data !== 'object' || !('parts' in data) || !Array.isArray(data.parts)) {
    return 0
  }

  return data.parts.length
}

function validateTopLevelPrompt(value: unknown, data: unknown) {
  const partCount = getPartCount(data)

  if (partCount === 1 && !hasMeaningfulRichTextContent(value)) {
    return 'Single-part questions must use the top-level prompt.'
  }

  return true
}

function validatePartPrompt(value: unknown, data: unknown) {
  const partCount = getPartCount(data)

  if (partCount > 1 && !hasMeaningfulRichTextContent(value)) {
    return 'Multipart questions require a prompt for every part.'
  }

  return true
}

function validateMultipleChoiceChoices(value: unknown) {
  const choices = Array.isArray(value) ? (value as MultipleChoiceChoice[]) : []

  if (choices.length < 2) {
    return 'Add at least two choices.'
  }

  const correctCount = choices.reduce((total, choice) => total + (choice?.isCorrect ? 1 : 0), 0)

  if (correctCount !== 1) {
    return 'Exactly one choice must be marked as correct.'
  }

  return true
}

function validateAcceptedAnswers(value: unknown) {
  const acceptedAnswers = Array.isArray(value) ? (value as ShortTextAcceptedAnswer[]) : []

  if (acceptedAnswers.length < 1) {
    return 'Add at least one accepted answer.'
  }

  const normalizedAnswers = acceptedAnswers
    .map((answer) =>
      typeof answer?.value === 'string' ? normalizeSimpleString(answer.value).toLowerCase() : '',
    )
    .filter(Boolean)

  if (normalizedAnswers.length !== acceptedAnswers.length) {
    return 'Accepted answers cannot be empty.'
  }

  if (new Set(normalizedAnswers).size !== normalizedAnswers.length) {
    return 'Accepted answers must be unique after normalization.'
  }

  return true
}

function validateResponseGroup(value: unknown) {
  const response = (value ?? {}) as ResponseGroupValue

  switch (response.type) {
    case 'multipleChoice':
      return validateMultipleChoiceChoices(response.multipleChoice?.choices)
    case 'shortText':
      return validateAcceptedAnswers(response.shortText?.acceptedAnswers)
    case 'selfReport':
      return true
    default:
      return 'Choose a response type.'
  }
}

const responseField: Field = {
  name: 'response',
  type: 'group',
  validate: (value) => validateResponseGroup(value),
  fields: [
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        {
          label: 'Multiple choice',
          value: 'multipleChoice',
        },
        {
          label: 'Short text',
          value: 'shortText',
        },
        {
          label: 'Self report',
          value: 'selfReport',
        },
      ],
    },
    {
      name: 'multipleChoice',
      type: 'group',
      admin: {
        condition: (_, siblingData) => siblingData?.type === 'multipleChoice',
      },
      fields: [
        {
          name: 'choices',
          type: 'array',
          minRows: 2,
          validate: (value) => validateMultipleChoiceChoices(value),
          fields: [
            {
              name: 'text',
              type: 'text',
              required: true,
            },
            {
              name: 'isCorrect',
              type: 'checkbox',
              label: 'Correct choice',
              defaultValue: false,
              required: true,
            },
          ],
        },
        {
          name: 'shuffle',
          type: 'checkbox',
          defaultValue: true,
          required: true,
        },
      ],
    },
    {
      name: 'shortText',
      type: 'group',
      admin: {
        condition: (_, siblingData) => siblingData?.type === 'shortText',
      },
      fields: [
        {
          name: 'acceptedAnswers',
          type: 'array',
          minRows: 1,
          validate: (value) => validateAcceptedAnswers(value),
          fields: [
            {
              name: 'value',
              type: 'text',
              required: true,
            },
          ],
        },
      ],
    },
    {
      name: 'selfReport',
      type: 'group',
      admin: {
        condition: (_, siblingData) => siblingData?.type === 'selfReport',
      },
      fields: [],
    },
  ],
}

export const Question: CollectionConfig = {
  slug: 'question',
  admin: {
    livePreview: {
      url: ({ data }) =>
        typeof data?.id === 'number'
          ? `/api/draft?slug=${encodeURIComponent(`/question/${data.id}`)}`
          : '',
    },
  },
  versions: {
    drafts: {
      autosave: {
        interval: 375,
      },
    },
  },
  fields: [
    {
      name: 'prompt',
      label: 'Question Prompt / Shared Context',
      type: 'richText',
      validate: (value, { data }) => validateTopLevelPrompt(value, data),
      admin: {
        description:
          'Use this for the full prompt on single-part questions, or shared context that sits above all parts on multipart questions.',
      },
    },
    {
      name: 'parts',
      type: 'array',
      admin: {
        description:
          'Single-part questions still use one part row. Add more rows only when the question genuinely has multiple parts.',
      },
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'prompt',
          label: 'Part Prompt',
          type: 'richText',
          validate: (value, { data }) => validatePartPrompt(value, data),
          admin: {
            condition: (data) => getPartCount(data) > 1,
            description:
              'Only shown for multipart questions. Keep any single-part prompt content at the top level instead.',
          },
        },
        {
          ...responseField,
          admin: {
            description: 'Choose how the learner responds to this part.',
          },
        },
        {
          name: 'workedSolutions',
          type: 'array',
          admin: {
            description:
              'Optional authored worked solutions shown after submission. They remain hidden until review is requested.',
          },
          fields: [
            {
              name: 'prompt',
              type: 'richText',
              required: true,
            },
            {
              name: 'subTopics',
              type: 'relationship',
              relationTo: 'subTopic',
              hasMany: true,
              admin: {
                description:
                  'Optional supporting subtopics used for filtering or analytics. These are not shown directly to students.',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'subTopics',
      type: 'relationship',
      relationTo: 'subTopic',
      hasMany: true,
      admin: {
        description:
          'Optional question-level subtopics. Learner-facing taxonomy is derived from these tags only.',
      },
    },
  ],
}
