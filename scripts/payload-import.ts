import { defaultImportMapPath, readJsonFile, writeJsonFile } from './payload-transfer/io'
import { assertTargetCollectionsEmpty, getPayloadInstance } from './payload-transfer/payload'
import { mappedId } from './payload-transfer/relationships'
import { remapRichTextMediaUploads } from './payload-transfer/rich-text'
import type {
  CollectionIdMap,
  ExportedQuestion,
  ExportedQuestionPart,
  ImportedId,
  PayloadExportArtifact,
  PayloadImportMapArtifact,
  TransferCollection,
} from './payload-transfer/types'

const exportPath = process.argv[2]

if (!exportPath) {
  throw new Error('Usage: bun run payload:import -- <export-json-path> [import-map-output-path]')
}

const importMapPath = process.argv[3] ?? defaultImportMapPath(exportPath)
const artifact = await readJsonFile<PayloadExportArtifact>(exportPath)

if (artifact.schemaVersion !== 1) {
  throw new Error(`Unsupported export schema version ${artifact.schemaVersion}.`)
}

const payload = await getPayloadInstance()
await assertTargetCollectionsEmpty(payload)

const maps: Record<TransferCollection, CollectionIdMap> = {
  media: {},
  question: {},
  subTopic: {},
  syllabus: {},
  syllabusSubTopic: {},
  topic: {},
  users: {},
}

console.log(`Importing Payload content from ${exportPath}`)

for (const user of artifact.records.users) {
  const created = await payload.db.create({
    collection: 'users',
    data: compactObject({
      createdAt: user.createdAt,
      email: user.email,
      hash: user.hash,
      lockUntil: user.lockUntil,
      loginAttempts: user.loginAttempts,
      resetPasswordExpiration: user.resetPasswordExpiration,
      resetPasswordToken: user.resetPasswordToken,
      roles: user.roles,
      salt: user.salt,
      updatedAt: user.updatedAt,
    }) as never,
  })
  maps.users[String(user.id)] = created.id as ImportedId
}
console.log(`Imported users: ${artifact.records.users.length}`)

for (const media of artifact.records.media) {
  const created = await payload.db.create({
    collection: 'media',
    data: compactObject({
      alt: media.alt,
      createdAt: media.createdAt,
      filename: media.filename,
      filesize: media.filesize,
      focalX: media.focalX,
      focalY: media.focalY,
      height: media.height,
      mimeType: media.mimeType,
      thumbnailURL: media.thumbnailURL,
      updatedAt: media.updatedAt,
      url: media.url,
      width: media.width,
    }) as never,
  })
  maps.media[String(media.id)] = created.id as ImportedId
}
console.log(`Imported media: ${artifact.records.media.length}`)

for (const topic of artifact.records.topics) {
  const created = await payload.create({
    collection: 'topic',
    data: {
      name: topic.name,
    },
    depth: 0,
  })
  maps.topic[String(topic.id)] = created.id as ImportedId
}
console.log(`Imported topics: ${artifact.records.topics.length}`)

for (const subTopic of artifact.records.subTopics) {
  const created = await payload.create({
    collection: 'subTopic',
    data: {
      name: subTopic.name,
      topic: mappedId(maps.topic, subTopic.topic, `subTopic ${subTopic.id}.topic`),
    } as never,
    depth: 0,
  })
  maps.subTopic[String(subTopic.id)] = created.id as ImportedId
}
console.log(`Imported subTopics: ${artifact.records.subTopics.length}`)

for (const syllabus of artifact.records.syllabuses) {
  const created = await payload.create({
    collection: 'syllabus',
    data: {
      name: syllabus.name,
    },
    depth: 0,
  })
  maps.syllabus[String(syllabus.id)] = created.id as ImportedId
}
console.log(`Imported syllabuses: ${artifact.records.syllabuses.length}`)

for (const syllabusSubTopic of artifact.records.syllabusSubTopics) {
  const created = await payload.create({
    collection: 'syllabusSubTopic',
    data: {
      status: syllabusSubTopic.status,
      subTopic: mappedId(
        maps.subTopic,
        syllabusSubTopic.subTopic,
        `syllabusSubTopic ${syllabusSubTopic.id}.subTopic`,
      ),
      syllabus: mappedId(
        maps.syllabus,
        syllabusSubTopic.syllabus,
        `syllabusSubTopic ${syllabusSubTopic.id}.syllabus`,
      ),
    } as never,
    depth: 0,
  })
  maps.syllabusSubTopic[String(syllabusSubTopic.id)] = created.id as ImportedId
}
console.log(`Imported syllabusSubTopics: ${artifact.records.syllabusSubTopics.length}`)

for (const question of artifact.records.questions) {
  const created = await payload.create({
    collection: 'question',
    data: buildQuestionData(question, maps.subTopic, maps.media) as never,
    depth: 0,
    draft: question._status === 'draft',
  })
  maps.question[String(question.id)] = created.id as ImportedId
}
console.log(`Imported questions: ${artifact.records.questions.length}`)

const importMap: PayloadImportMapArtifact = {
  exportedAt: artifact.exportedAt,
  importFinishedAt: new Date().toISOString(),
  maps,
  schemaVersion: 1,
  sourceExportPath: exportPath,
}

await writeJsonFile(importMapPath, importMap)
console.log(`Wrote import map to ${importMapPath}`)

function buildQuestionData(
  question: ExportedQuestion,
  subTopicMap: CollectionIdMap,
  mediaMap: CollectionIdMap,
) {
  return compactObject({
    _status: question._status,
    parts: question.parts.map((part, index) =>
      buildQuestionPartData(part, subTopicMap, mediaMap, `question ${question.id}.parts[${index}]`),
    ),
    prompt: remapRichTextMediaUploads(question.prompt, mediaMap, `question ${question.id}.prompt`),
    subTopics: question.subTopics?.map((id) => mappedId(subTopicMap, id, `question ${question.id}.subTopics`)),
  })
}

function buildQuestionPartData(
  part: ExportedQuestionPart,
  subTopicMap: CollectionIdMap,
  mediaMap: CollectionIdMap,
  label: string,
) {
  return compactObject({
    id: part.id,
    prompt: remapRichTextMediaUploads(part.prompt, mediaMap, `${label}.prompt`),
    response: part.response,
    workedSolutions:
      part.workedSolutions?.map((workedSolution, index) =>
        compactObject({
          id: workedSolution.id,
          prompt: remapRichTextMediaUploads(
            workedSolution.prompt,
            mediaMap,
            `${label}.workedSolutions[${index}].prompt`,
          ),
          subTopics: workedSolution.subTopics?.map((id) =>
            mappedId(subTopicMap, id, `workedSolution ${workedSolution.id ?? '<no-id>'}.subTopics`),
          ),
        }),
      ) ?? undefined,
  })
}

function compactObject<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined),
  ) as Partial<T>
}
