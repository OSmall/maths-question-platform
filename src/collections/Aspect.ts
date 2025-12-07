import { CollectionConfig } from 'payload'

export const Aspect: CollectionConfig = {
  slug: 'aspect',
  admin: {
    useAsTitle: 'name',
    description: 'Aspects are specific areas of learning and are the lowest level of categorisation of a question. They are often a suptopic on a syllabus.',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
    },
  ],
}
