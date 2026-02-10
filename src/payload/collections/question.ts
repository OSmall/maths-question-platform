import { CollectionConfig } from 'payload'
import { multipleChoiceBlock } from '@/payload/blocks/answer-mechanism/multiple-choice-block'
import { selfReportBlock } from '@/payload/blocks/answer-mechanism/self-report-block'
import { freeTextValidationBlock } from '@/payload/blocks/answer-mechanism/free-text-validation-block'

export const Question: CollectionConfig = {
  slug: 'question',
  admin: {
    livePreview: {
      url: ({ data }) => `/question/${data.id}`,
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
      name: 'overallQuestionRichText',
      label: 'Overall Question/Context',
      type: 'richText',
      admin: {
        description:
          'The overall question or context for the question. This will be displayed above the parts of the question.',
      },
      required: true,
    },
    {
      name: 'parts',
      type: 'array',
      admin: {
        description:
          'The parts of the question can be subquestions or just a single part for questions with no subquestions.',
      },
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'partRichText',
          label: 'Question Part Text',
          type: 'richText',
          admin: {
            description:
              'The rich text for just this part of the question. Leave this blank if this is a question with no subquestions. Don\'t include the subquestion identifier e.g. "ii." or "b)".',
          },
        },
        {
          name: 'answerMechanism',
          type: 'blocks',
          admin: {
            description: 'The sort of input that is received for this part of the question.',
          },
          required: true,
          minRows: 1,
          maxRows: 1,
          blocks: [multipleChoiceBlock, selfReportBlock, freeTextValidationBlock],
        },
        {
          name: 'solutionMethods',
          type: 'array',
          admin: {
            description: 'The various worked solution methods for this part of the question.',
          },
          fields: [
            {
              name: 'solutionRichText',
              type: 'richText',
              required: true,
            },
            {
              name: 'solutionAspects',
              type: 'relationship',
              admin: {
                description:
                  'If the solution requires knowledge of aspects from a different area of learning compared to the question, we want to record that here so we can filter them out if need be.',
              },
              relationTo: 'aspect',
              hasMany: true,
            },
          ],
        },
      ],
    },
    {
      name: 'questionAspects',
      type: 'relationship',
      admin: {
        description:
          'The aspects that this question is testing. If the question has multiple parts, these aspects should cover all parts of the question.',
      },
      relationTo: 'aspect',
      hasMany: true,
    },
  ],
}
