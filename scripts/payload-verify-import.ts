import { defaultImportMapPath, readJsonFile } from './payload-transfer/io'
import { findAll, getPayloadInstance } from './payload-transfer/payload'
import { mappedId, relationshipId } from './payload-transfer/relationships'
import { remapRichTextMediaUploads } from './payload-transfer/rich-text'
import type {
  CollectionIdMap,
  ExportedQuestion,
  ImportedId,
  PayloadExportArtifact,
  PayloadImportMapArtifact,
  TransferCollection,
} from './payload-transfer/types'

const exportPath = process.argv[2]

if (!exportPath) {
  throw new Error('Usage: bun run payload:verify-import -- <export-json-path> [import-map-path]')
}

const importMapPath = process.argv[3] ?? defaultImportMapPath(exportPath)
const artifact = await readJsonFile<PayloadExportArtifact>(exportPath)
const importMap = await readJsonFile<PayloadImportMapArtifact>(importMapPath)
const payload = await getPayloadInstance()

if (artifact.schemaVersion !== 1 || importMap.schemaVersion !== 1) {
  throw new Error('Unsupported export/import-map schema version.')
}

console.log(`Verifying import from ${exportPath}`)
console.log(`Using import map ${importMapPath}`)

await assertCollectionCount('users', artifact.records.users.length)
await assertCollectionCount('media', artifact.records.media.length)
await assertCollectionCount('topic', artifact.records.topics.length)
await assertCollectionCount('subTopic', artifact.records.subTopics.length)
await assertCollectionCount('syllabus', artifact.records.syllabuses.length)
await assertCollectionCount('syllabusSubTopic', artifact.records.syllabusSubTopics.length)
await assertCollectionCount('question', artifact.records.questions.length)

for (const user of artifact.records.users) {
  const loaded = await payload.findByID({
    collection: 'users',
    depth: 0,
    id: mappedId(importMap.maps.users, user.id, `user ${user.id}`),
    showHiddenFields: true,
  })
  assertEqual(loaded.email, user.email, `user ${user.id}.email`)
  assertJsonEqual(loaded.roles ?? null, user.roles ?? null, `user ${user.id}.roles`)
  assertEqual(loaded.hash ?? null, user.hash ?? null, `user ${user.id}.hash`)
  assertEqual(loaded.salt ?? null, user.salt ?? null, `user ${user.id}.salt`)
}

for (const media of artifact.records.media) {
  const loaded = await payload.findByID({
    collection: 'media',
    depth: 0,
    id: mappedId(importMap.maps.media, media.id, `media ${media.id}`),
  })
  assertEqual(loaded.alt, media.alt, `media ${media.id}.alt`)
  assertEqual(loaded.filename ?? null, media.filename ?? null, `media ${media.id}.filename`)
  assertEqual(loaded.mimeType ?? null, media.mimeType ?? null, `media ${media.id}.mimeType`)
  assertEqual(loaded.filesize ?? null, media.filesize ?? null, `media ${media.id}.filesize`)
}

for (const topic of artifact.records.topics) {
  const loaded = await payload.findByID({
    collection: 'topic',
    depth: 0,
    id: mappedId(importMap.maps.topic, topic.id, `topic ${topic.id}`),
  })
  assertEqual(loaded.name, topic.name, `topic ${topic.id}.name`)
}

for (const subTopic of artifact.records.subTopics) {
  const loaded = await payload.findByID({
    collection: 'subTopic',
    depth: 0,
    id: mappedId(importMap.maps.subTopic, subTopic.id, `subTopic ${subTopic.id}`),
  })
  assertEqual(loaded.name, subTopic.name, `subTopic ${subTopic.id}.name`)
  assertEqual(
    relationshipId(loaded.topic),
    mappedId(importMap.maps.topic, subTopic.topic, `subTopic ${subTopic.id}.topic`),
    `subTopic ${subTopic.id}.topic`,
  )
}

for (const syllabus of artifact.records.syllabuses) {
  const loaded = await payload.findByID({
    collection: 'syllabus',
    depth: 0,
    id: mappedId(importMap.maps.syllabus, syllabus.id, `syllabus ${syllabus.id}`),
  })
  assertEqual(loaded.name, syllabus.name, `syllabus ${syllabus.id}.name`)
}

for (const syllabusSubTopic of artifact.records.syllabusSubTopics) {
  const loaded = await payload.findByID({
    collection: 'syllabusSubTopic',
    depth: 0,
    id: mappedId(
      importMap.maps.syllabusSubTopic,
      syllabusSubTopic.id,
      `syllabusSubTopic ${syllabusSubTopic.id}`,
    ),
  })
  assertEqual(loaded.status, syllabusSubTopic.status, `syllabusSubTopic ${syllabusSubTopic.id}.status`)
  assertEqual(
    relationshipId(loaded.syllabus),
    mappedId(importMap.maps.syllabus, syllabusSubTopic.syllabus, `syllabusSubTopic ${syllabusSubTopic.id}.syllabus`),
    `syllabusSubTopic ${syllabusSubTopic.id}.syllabus`,
  )
  assertEqual(
    relationshipId(loaded.subTopic),
    mappedId(importMap.maps.subTopic, syllabusSubTopic.subTopic, `syllabusSubTopic ${syllabusSubTopic.id}.subTopic`),
    `syllabusSubTopic ${syllabusSubTopic.id}.subTopic`,
  )
}

for (const question of artifact.records.questions) {
  await verifyQuestion(question, importMap.maps.question, importMap.maps.subTopic, importMap.maps.media)
}

console.log('Payload import verification passed')

async function assertCollectionCount(collection: TransferCollection, expectedCount: number) {
  const docs = await findAll<unknown>(payload, collection)
  assertEqual(docs.length, expectedCount, `${collection} count`)
}

async function verifyQuestion(
  question: ExportedQuestion,
  questionMap: CollectionIdMap,
  subTopicMap: CollectionIdMap,
  mediaMap: CollectionIdMap,
) {
  const loaded = await payload.findByID({
    collection: 'question',
    depth: 0,
    id: mappedId(questionMap, question.id, `question ${question.id}`),
  })

  assertEqual(loaded.parts.length, question.parts.length, `question ${question.id}.parts.length`)
  assertJsonEqual(
    relationshipArray(loaded.subTopics),
    (question.subTopics ?? []).map((id) => mappedId(subTopicMap, id, `question ${question.id}.subTopics`)),
    `question ${question.id}.subTopics`,
  )
  assertEqual(loaded._status ?? null, question._status ?? null, `question ${question.id}._status`)
  assertJsonEqual(
    loaded.prompt ?? null,
    remapRichTextMediaUploads(question.prompt ?? null, mediaMap, `question ${question.id}.prompt`),
    `question ${question.id}.prompt`,
  )

  loaded.parts.forEach((part, index) => {
    const exportedPart = question.parts[index]
    if (!exportedPart) {
      throw new Error(`question ${question.id}.parts[${index}] missing exported part.`)
    }

    assertEqual(part.id ?? null, exportedPart.id ?? null, `question ${question.id}.parts[${index}].id`)
    assertEqual(part.response.type, exportedPart.response.type, `question ${question.id}.parts[${index}].response.type`)
    assertJsonEqual(
      part.prompt ?? null,
      remapRichTextMediaUploads(
        exportedPart.prompt ?? null,
        mediaMap,
        `question ${question.id}.parts[${index}].prompt`,
      ),
      `question ${question.id}.parts[${index}].prompt`,
    )
    assertJsonEqual(
      part.workedSolutions?.map((solution) => relationshipArray(solution.subTopics)) ?? null,
      exportedPart.workedSolutions?.map((solution) =>
        (solution.subTopics ?? []).map((id) =>
          mappedId(subTopicMap, id, `question ${question.id}.parts[${index}].workedSolutions.subTopics`),
        ),
      ) ?? null,
      `question ${question.id}.parts[${index}].workedSolutions.subTopics`,
    )
    assertJsonEqual(
      part.workedSolutions?.map((solution) => solution.prompt ?? null) ?? null,
      exportedPart.workedSolutions?.map((solution, solutionIndex) =>
        remapRichTextMediaUploads(
          solution.prompt ?? null,
          mediaMap,
          `question ${question.id}.parts[${index}].workedSolutions[${solutionIndex}].prompt`,
        ),
      ) ?? null,
      `question ${question.id}.parts[${index}].workedSolutions.prompt`,
    )
  })
}

function relationshipArray(value: unknown): ImportedId[] {
  if (value == null) {
    return []
  }

  if (!Array.isArray(value)) {
    throw new Error('Expected relationship array.')
  }

  return value.map((item) => {
    const id = relationshipId(item)
    if (id == null) {
      throw new Error('Expected relationship item ID.')
    }
    return id
  })
}

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(`${label} expected ${formatValue(expected)}, received ${formatValue(actual)}.`)
  }
}

function assertJsonEqual(actual: unknown, expected: unknown, label: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label} expected ${formatValue(expected)}, received ${formatValue(actual)}.`)
  }
}

function formatValue(value: unknown) {
  return JSON.stringify(value)
}
