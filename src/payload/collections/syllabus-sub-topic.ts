import type { CollectionConfig, PayloadRequest } from 'payload'

import { adminOnly } from '@/payload/access'

import { normalizeSyllabusSubTopicInput, validateUniqueSyllabusSubTopic } from './syllabus-utils'

export const SyllabusSubTopic: CollectionConfig = {
  slug: 'syllabusSubTopic',
  access: {
    admin: adminOnly,
    create: adminOnly,
    delete: adminOnly,
    read: adminOnly,
    update: adminOnly,
  },
  labels: {
    plural: 'Syllabus Coverage',
    singular: 'Coverage Mapping',
  },
  admin: {
    defaultColumns: ['syllabus', 'subTopic', 'status', 'updatedAt'],
    description: 'Matrix-first coverage mapping between syllabuses and subtopics.',
    useAsTitle: 'status',
    components: {
      views: {
        list: {
          actions: [
            '/components/admin/syllabus-coverage-view-toggle-action#SyllabusCoverageViewToggleAction',
          ],
          Component: '/components/admin/syllabus-coverage-list-view#SyllabusCoverageListView',
        },
      },
    },
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        return normalizeSyllabusSubTopicInput(data)
      },
    ],
  },
  fields: [
    {
      name: 'syllabus',
      type: 'relationship',
      relationTo: 'syllabus',
      required: true,
    },
    {
      name: 'subTopic',
      type: 'relationship',
      relationTo: 'subTopic',
      required: true,
      validate: async (
        value: unknown,
        options: { data?: unknown; id?: number | string; req: PayloadRequest },
      ) => {
        const relationshipValue =
          typeof value === 'string'
            ? value
            : value &&
                typeof value === 'object' &&
                'id' in value &&
                typeof value.id === 'string'
              ? value.id
              : undefined

        return validateUniqueSyllabusSubTopic({
          id: typeof options.id === 'string' ? options.id : undefined,
          req: options.req,
          subTopic: relationshipValue,
          syllabus: (options.data as { syllabus?: string | { id?: string | null } | null } | undefined)
            ?.syllabus,
        })
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'included',
      options: [
        {
          label: 'Included',
          value: 'included',
        },
        {
          label: 'Assumed knowledge',
          value: 'assumedKnowledge',
        },
      ],
    },
  ],
  indexes: [
    {
      fields: ['syllabus', 'subTopic'],
      unique: true,
    },
  ],
}
