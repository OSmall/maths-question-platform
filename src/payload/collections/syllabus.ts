import type { CollectionConfig } from 'payload'

import { normalizeSyllabusInput } from './syllabus-utils'

export const Syllabus: CollectionConfig = {
  slug: 'syllabus',
  labels: {
    plural: 'Syllabuses',
    singular: 'Syllabus',
  },
  admin: {
    defaultColumns: ['name', 'updatedAt'],
    description: 'Syllabuses define coverage over the existing topic and subtopic taxonomy.',
    useAsTitle: 'name',
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        return normalizeSyllabusInput(data)
      },
    ],
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
