import { assertEqual, assertPayloadId, assertRecord, assertRelationshipResolves } from '../assertions'
import type { SmokeFixture, SmokeId } from '../types'

export const topicFixture: SmokeFixture = {
  name: 'topic',
  async create(context) {
    context.records.topic = await context.payload.create({
      collection: 'topic',
      data: {
        name: `Smoke Topic ${context.marker}`,
      },
      depth: 0,
    })
  },
  async verify(context) {
    const topic = assertRecord(context.records.topic, 'Topic')
    assertPayloadId(topic.id, 'Topic ID', context.expectedPayloadIdType)

    const loaded = await context.payload.findByID({ collection: 'topic', depth: 0, id: topic.id })
    assertEqual(loaded.name, topic.name, 'Topic name')
  },
}

export const subTopicFixture: SmokeFixture = {
  name: 'subTopic',
  async create(context) {
    const topic = assertRecord(context.records.topic, 'Topic')

    context.records.subTopic = await context.payload.create({
      collection: 'subTopic',
      data: {
        name: `Smoke Subtopic ${context.marker}`,
        topic: topic.id,
      },
      depth: 0,
    })
  },
  async verify(context) {
    const topic = assertRecord(context.records.topic, 'Topic')
    const subTopic = assertRecord(context.records.subTopic, 'Subtopic')
    assertPayloadId(subTopic.id, 'Subtopic ID', context.expectedPayloadIdType)
    assertEqual(subTopic.topic, topic.id, 'Subtopic depth: 0 topic relationship')

    await assertRelationshipResolves(context, {
      collection: 'subTopic',
      id: subTopic.id,
      label: 'Subtopic topic',
      predicate: (document) => {
        const candidate = document as { topic?: { id?: SmokeId } }
        return candidate.topic?.id === topic.id
      },
    })
  },
}
