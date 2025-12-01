import { Block } from 'payload'

export const freeTextValidationBlock: Block = {
  slug: 'freeTextValidation',
  labels: {
    singular: 'Free Text Validation',
    plural: 'Free Text Validations',
  },
  fields: [
    {
      name: 'correctAnswer',
      type: 'text',
    },
  ],
}
