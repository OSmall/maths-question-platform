import { CollectionConfig } from 'payload'
import { multipleChoiceBlock } from '@/blocks/answerMechanisms/multipleChoiceBlock'
import { selfReportBlock } from '@/blocks/answerMechanisms/selfReportBlock'
import { freeTextValidationBlock } from '@/blocks/answerMechanisms/freeTextValidationBlock'

export const Question: CollectionConfig = {
  slug: 'question',
  fields: [
    {
      name: 'questionRichText',
      type: 'richText',
      required: true,
    },
    {
      name: 'answerMechanism',
      type: 'blocks',
      required: true,
      minRows: 1,
      maxRows: 1,
      blocks: [multipleChoiceBlock, selfReportBlock, freeTextValidationBlock],
    },
    {
      name: 'aspects',
      type: 'relationship',
      relationTo: 'aspect',
      hasMany: true,
    },
  ],
}
