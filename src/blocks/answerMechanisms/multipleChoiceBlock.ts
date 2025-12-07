import { Block } from 'payload'

type AnswerRow = {
  answer: string
  isCorrect?: boolean | null
}

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
      required: true,
      validate: (value) => {
        const answers: AnswerRow[] = (value || []) as AnswerRow[]
        const correctCount = answers.reduce<number>((acc, row) => acc + (row?.isCorrect ? 1 : 0), 0)
        if (correctCount !== 1) {
          return 'Exactly one answer must be marked as Correct.'
        }
        return true
      },
      fields: [
        { name: 'answer', type: 'text', required: true },
        {
          name: 'isCorrect',
          type: 'checkbox',
          label: 'Correct Answer',
        },
      ],
    },
    { name: 'shuffle', type: 'checkbox', defaultValue: true },
  ],
}
