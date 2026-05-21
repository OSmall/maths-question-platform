import { assertEqual, assertPayloadId, assertRecord } from '../assertions'
import { richText } from '../rich-text'
import type { SmokeFixture } from '../types'

export const questionFixture: SmokeFixture = {
  name: 'question',
  async create(context) {
    const subTopic = assertRecord(context.records.subTopic, 'Subtopic')
    const idSuffix = context.marker

    const question = await context.payload.create({
      collection: 'question',
      data: {
        _status: 'published',
        parts: [
          {
            id: `smoke-mc-part-${idSuffix}`,
            prompt: richText('Smoke multiple choice part prompt'),
            response: {
              multipleChoice: {
                choices: [
                  { id: `smoke-mc-a-${idSuffix}`, isCorrect: false, text: '3' },
                  { id: `smoke-mc-b-${idSuffix}`, isCorrect: true, text: '4' },
                ],
                shuffle: false,
              },
              type: 'multipleChoice',
            },
            workedSolutions: [
              {
                prompt: richText('Smoke worked solution'),
                subTopics: [subTopic.id],
              },
            ],
          },
          {
            id: `smoke-short-part-${idSuffix}`,
            prompt: richText('Smoke short text part prompt'),
            response: {
              shortText: {
                acceptedAnswers: [{ id: `smoke-answer-${idSuffix}`, value: '42' }],
              },
              type: 'shortText',
            },
          },
          {
            id: `smoke-self-part-${idSuffix}`,
            prompt: richText('Smoke self report part prompt'),
            response: {
              selfReport: {},
              type: 'selfReport',
            },
          },
        ],
        prompt: richText(`Smoke question ${context.marker}`),
        subTopics: [subTopic.id],
      },
      depth: 0,
    })

    const versions = await context.payload.findVersions({
      collection: 'question',
      depth: 0,
      limit: 1,
      sort: '-updatedAt',
      where: {
        parent: {
          equals: question.id,
        },
      },
    })

    const version = versions.docs[0]
    if (!version) {
      throw new Error('Published smoke question did not create a version row.')
    }

    context.records.question = question
    context.records.questionVersionId = version.id
  },
  async verify(context) {
    const question = assertRecord(context.records.question, 'Question')
    const versionId = assertRecord(context.records.questionVersionId, 'Question version ID')
    assertPayloadId(question.id, 'Question ID', context.expectedPayloadIdType)

    const loaded = await context.payload.findByID({ collection: 'question', depth: 1, id: question.id })
    assertEqual(loaded.parts.length, 3, 'Question part count')

    const version = await context.payload.findVersionByID({
      collection: 'question',
      depth: 0,
      id: versionId,
    })
    assertEqual(version.parent, question.id, 'Question version parent relationship')
  },
}
