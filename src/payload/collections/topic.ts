import type { CollectionConfig, PayloadRequest } from 'payload'

import { normalizeTopicInput, validateUniqueTopicName } from './taxonomy-utils'

export const Topic: CollectionConfig = {
  slug: 'topic',
  admin: {
    useAsTitle: 'name',
    description: 'Topics are the broadest curriculum groupings used to organise subtopics.',
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        return normalizeTopicInput(data)
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
        options: { id?: number | string; req: PayloadRequest },
      ) => {
        if (typeof value !== 'string' || value.trim().length === 0) {
          return 'Topic name is required.'
        }

        return validateUniqueTopicName({
          id: options.id,
          name: value,
          req: options.req,
        })
      },
    },
  ],
}
