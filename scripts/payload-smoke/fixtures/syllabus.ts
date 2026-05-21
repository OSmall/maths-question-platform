import { assertEqual, assertPayloadId, assertRecord, assertRelationshipResolves } from '../assertions'
import type { SmokeFixture, SmokeId } from '../types'

export const syllabusFixture: SmokeFixture = {
  name: 'syllabus',
  async create(context) {
    context.records.syllabus = await context.payload.create({
      collection: 'syllabus',
      data: {
        name: `Smoke Syllabus ${context.marker}`,
      },
      depth: 0,
    })
  },
  async verify(context) {
    const syllabus = assertRecord(context.records.syllabus, 'Syllabus')
    assertPayloadId(syllabus.id, 'Syllabus ID', context.expectedPayloadIdType)

    const loaded = await context.payload.findByID({
      collection: 'syllabus',
      depth: 0,
      id: syllabus.id,
    })
    assertEqual(loaded.name, syllabus.name, 'Syllabus name')
  },
}

export const syllabusSubTopicFixture: SmokeFixture = {
  name: 'syllabusSubTopic',
  async create(context) {
    const subTopic = assertRecord(context.records.subTopic, 'Subtopic')
    const syllabus = assertRecord(context.records.syllabus, 'Syllabus')

    context.records.syllabusSubTopic = await context.payload.create({
      collection: 'syllabusSubTopic',
      data: {
        status: 'included',
        subTopic: subTopic.id,
        syllabus: syllabus.id,
      },
      depth: 0,
    })
  },
  async verify(context) {
    const subTopic = assertRecord(context.records.subTopic, 'Subtopic')
    const syllabus = assertRecord(context.records.syllabus, 'Syllabus')
    const syllabusSubTopic = assertRecord(
      context.records.syllabusSubTopic,
      'Syllabus subtopic mapping',
    )
    assertPayloadId(
      syllabusSubTopic.id,
      'Syllabus subtopic mapping ID',
      context.expectedPayloadIdType,
    )
    assertEqual(
      syllabusSubTopic.syllabus,
      syllabus.id,
      'Syllabus subtopic depth: 0 syllabus relationship',
    )
    assertEqual(
      syllabusSubTopic.subTopic,
      subTopic.id,
      'Syllabus subtopic depth: 0 subtopic relationship',
    )

    await assertRelationshipResolves(context, {
      collection: 'syllabusSubTopic',
      id: syllabusSubTopic.id,
      label: 'Syllabus subtopic relationships',
      predicate: (document) => {
        const candidate = document as {
          subTopic?: { id?: SmokeId }
          syllabus?: { id?: SmokeId }
        }
        return candidate.syllabus?.id === syllabus.id && candidate.subTopic?.id === subTopic.id
      },
    })
  },
}
