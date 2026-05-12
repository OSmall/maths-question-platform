import type { CollectionBeforeValidateHook, CollectionConfig, PayloadRequest } from 'payload'

import { authenticated, ownerOrAdmin } from '@/payload/access'

import {
  normalizeStudySessionInput,
  type QuestionVersionForStudySession,
  validateStudySessionQuestionRelationship,
  type StudySessionInput,
} from './study-session-utils'

const normalizeStudySession: CollectionBeforeValidateHook = async ({ data, operation, originalDoc, req }) => {
  return normalizeStudySessionInput({
    data: data as StudySessionInput | undefined,
    lockQuestionVersion: (questionId) => fetchLatestPublishedQuestionVersion(req, questionId),
    operation,
    originalDoc: originalDoc as StudySessionInput | undefined,
  })
}

async function fetchLatestPublishedQuestionVersion(
  req: PayloadRequest,
  questionId: number,
): Promise<QuestionVersionForStudySession> {
  const versions = await req.payload.findVersions({
    collection: 'question',
    depth: 0,
    draft: true,
    limit: 1,
    req,
    sort: '-updatedAt',
    where: {
      and: [
        {
          parent: {
            equals: questionId,
          },
        },
        {
          'version._status': {
            equals: 'published',
          },
        },
      ],
    },
  })

  const version = versions.docs[0]
  if (!version) {
    throw new Error(`Question ${questionId} does not have a published version.`)
  }

  return version as QuestionVersionForStudySession
}

export const StudySession: CollectionConfig = {
  slug: 'studySession',
  labels: {
    plural: 'Study Sessions',
    singular: 'Study Session',
  },
  access: {
    create: authenticated,
    delete: ownerOrAdmin,
    read: ownerOrAdmin,
    update: ownerOrAdmin,
  },
  admin: {
    defaultColumns: ['id', 'user', 'state', 'begunAt', 'endedAt', 'updatedAt'],
    description: 'Persisted learner study sessions with locked question versions and answers.',
  },
  hooks: {
    beforeValidate: [normalizeStudySession],
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users' as never,
      required: true,
    },
    {
      name: 'state',
      type: 'select',
      defaultValue: 'started',
      required: true,
      options: [
        {
          label: 'Not started',
          value: 'notStarted',
        },
        {
          label: 'Started',
          value: 'started',
        },
        {
          label: 'Finished',
          value: 'finished',
        },
      ],
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'begunAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        readOnly: true,
      },
    },
    {
      name: 'endedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        readOnly: true,
      },
    },
    {
      name: 'questions',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'question',
          type: 'relationship',
          relationTo: 'question' as never,
          required: true,
          validate: (value: unknown, { data }: { data?: unknown }) =>
            validateStudySessionQuestionRelationship(value, data),
        },
        {
          name: 'questionVersionId',
          type: 'text',
          required: true,
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'status',
          type: 'select',
          defaultValue: 'notStarted',
          required: true,
          options: [
            {
              label: 'Not started',
              value: 'notStarted',
            },
            {
              label: 'Skipped',
              value: 'skipped',
            },
            {
              label: 'Answered',
              value: 'answered',
            },
          ],
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'flagged',
          type: 'checkbox',
          defaultValue: false,
          required: true,
        },
        {
          name: 'answeredAt',
          type: 'date',
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
            readOnly: true,
          },
        },
        {
          name: 'skippedAt',
          type: 'date',
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
            readOnly: true,
          },
        },
        {
          name: 'answers',
          type: 'array',
          required: true,
          admin: {
            readOnly: true,
          },
          fields: [
            {
              name: 'partId',
              type: 'text',
              required: true,
            },
            {
              name: 'type',
              type: 'select',
              required: true,
              options: [
                {
                  label: 'Unanswered',
                  value: 'unanswered',
                },
                {
                  label: 'Multiple choice',
                  value: 'multipleChoice',
                },
                {
                  label: 'Short text',
                  value: 'shortText',
                },
                {
                  label: 'Self report',
                  value: 'selfReport',
                },
              ],
            },
            {
              name: 'multipleChoice',
              type: 'group',
              admin: {
                condition: (_, siblingData) => siblingData?.type === 'multipleChoice',
              },
              fields: [
                {
                  name: 'choiceId',
                  type: 'text',
                },
              ],
            },
            {
              name: 'shortText',
              type: 'group',
              admin: {
                condition: (_, siblingData) => siblingData?.type === 'shortText',
              },
              fields: [
                {
                  name: 'answer',
                  type: 'text',
                },
              ],
            },
            {
              name: 'selfReport',
              type: 'group',
              admin: {
                condition: (_, siblingData) => siblingData?.type === 'selfReport',
              },
              fields: [
                {
                  name: 'answer',
                  type: 'checkbox',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
