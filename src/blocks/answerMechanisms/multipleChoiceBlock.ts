import { Block } from 'payload'

export const multipleChoiceBlock: Block = {
  slug: 'multipleChoice',
  labels: {
    singular: 'Multiple Choice',
    plural: 'Multiple Choices',
  },
  fields: [
    {
      name: 'answers',
      label: 'Answers',
      type: 'array',
      minRows: 1,
      fields: [
        { name: 'answer', type: 'text', required: true },
        { name: 'isCorrect', type: 'checkbox', label: 'Correct Answer' },
      ],
    },
    { name: 'shuffle', type: 'checkbox' },
  ],
}
