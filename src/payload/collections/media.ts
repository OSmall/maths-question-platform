import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/payload/access'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    admin: adminOnly,
    create: adminOnly,
    delete: adminOnly,
    read: () => true,
    update: adminOnly,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  upload: true,
}
