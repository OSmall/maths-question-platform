import type { CollectionConfig, PayloadRequest } from 'payload'

import { normalizeSubTopicInput, validateUniqueSubTopicName } from './taxonomy-utils'

export const SubTopic: CollectionConfig = {
  slug: 'subTopic',
  admin: {
    defaultColumns: ['name', 'topic', 'updatedAt'],
    description:
      'Subtopics are the curriculum tags applied to questions and worked solutions. Each belongs to one parent topic.',
    useAsTitle: 'name',
    components: {
      edit: {
        beforeDocumentControls: ['/components/admin/sub-topic-edit-title#SubTopicEditTitle'],
      },
    },
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        return normalizeSubTopicInput(data)
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      validate: async (
        value: null | string | undefined,
        options: {
          data?: { topic?: number | { id?: number | null } | null }
          id?: number | string
          req: PayloadRequest
        },
      ) => {
        if (typeof value !== 'string' || value.trim().length === 0) {
          return 'Subtopic name is required.'
        }

        return validateUniqueSubTopicName({
          id: options.id,
          name: value,
          req: options.req,
          topic: options.data?.topic,
        })
      },
      admin: {
        components: {
          Cell: '/components/admin/sub-topic-name-cell#SubTopicNameCell',
        },
      },
    },
    {
      name: 'topic',
      type: 'relationship',
      relationTo: 'topic',
      required: true,
    },
  ],
}
