import { CollectionConfig } from 'payload'

export const Aspect: CollectionConfig = {
  slug: 'aspect',
  admin: {
    useAsTitle: 'name',
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
