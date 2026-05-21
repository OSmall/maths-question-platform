import type {
  Media,
  Question,
  SubTopic,
  Syllabus,
  SyllabusSubTopic,
  Topic,
  User,
} from '@/payload/payload-types'

import { defaultExportPath, writeJsonFile } from './payload-transfer/io'
import { findAll, getPayloadInstance } from './payload-transfer/payload'
import { legacyRelationshipId, optionalLegacyRelationshipIds } from './payload-transfer/relationships'
import type {
  ExportedMedia,
  ExportedQuestion,
  ExportedQuestionPart,
  ExportedSubTopic,
  ExportedSyllabusSubTopic,
  LegacyId,
  PayloadExportArtifact,
} from './payload-transfer/types'

const outputPath = process.argv[2] ?? defaultExportPath()
const payload = await getPayloadInstance()

console.log('Exporting Payload content from current database')

const users = await findAll<User>(payload, 'users')
const media = await findAll<Media>(payload, 'media')
const topics = await findAll<Topic>(payload, 'topic')
const subTopics = await findAll<SubTopic>(payload, 'subTopic')
const syllabuses = await findAll<Syllabus>(payload, 'syllabus')
const syllabusSubTopics = await findAll<SyllabusSubTopic>(payload, 'syllabusSubTopic')
const questions = await findAll<Question>(payload, 'question')

const artifact: PayloadExportArtifact = {
  exportedAt: new Date().toISOString(),
  records: {
    media: media.map(exportMedia),
    questions: questions.map(exportQuestion),
    subTopics: subTopics.map((subTopic): ExportedSubTopic => ({
      createdAt: subTopic.createdAt,
      id: legacyRecordId(subTopic.id, `subTopic ${subTopic.id}`),
      name: subTopic.name,
      topic: legacyRelationshipId(subTopic.topic, `subTopic ${subTopic.id}.topic`),
      updatedAt: subTopic.updatedAt,
    })),
    syllabuses: syllabuses.map((syllabus) => ({
      createdAt: syllabus.createdAt,
      id: legacyRecordId(syllabus.id, `syllabus ${syllabus.id}`),
      name: syllabus.name,
      updatedAt: syllabus.updatedAt,
    })),
    syllabusSubTopics: syllabusSubTopics.map(
      (syllabusSubTopic): ExportedSyllabusSubTopic => ({
        createdAt: syllabusSubTopic.createdAt,
        id: legacyRecordId(syllabusSubTopic.id, `syllabusSubTopic ${syllabusSubTopic.id}`),
        status: syllabusSubTopic.status,
        subTopic: legacyRelationshipId(
          syllabusSubTopic.subTopic,
          `syllabusSubTopic ${syllabusSubTopic.id}.subTopic`,
        ),
        syllabus: legacyRelationshipId(
          syllabusSubTopic.syllabus,
          `syllabusSubTopic ${syllabusSubTopic.id}.syllabus`,
        ),
        updatedAt: syllabusSubTopic.updatedAt,
      }),
    ),
    topics: topics.map((topic) => ({
      createdAt: topic.createdAt,
      id: legacyRecordId(topic.id, `topic ${topic.id}`),
      name: topic.name,
      updatedAt: topic.updatedAt,
    })),
    users: users.map((user) => ({
      createdAt: user.createdAt,
      email: user.email,
      hash: user.hash,
      id: legacyRecordId(user.id, `user ${user.id}`),
      lockUntil: user.lockUntil,
      loginAttempts: user.loginAttempts,
      resetPasswordExpiration: user.resetPasswordExpiration,
      resetPasswordToken: user.resetPasswordToken,
      roles: user.roles,
      salt: user.salt,
      updatedAt: user.updatedAt,
    })),
  },
  schemaVersion: 1,
}

await writeJsonFile(outputPath, artifact)

console.log(`Exported Payload content to ${outputPath}`)
console.log(`users: ${artifact.records.users.length}`)
console.log(`media: ${artifact.records.media.length}`)
console.log(`topics: ${artifact.records.topics.length}`)
console.log(`subTopics: ${artifact.records.subTopics.length}`)
console.log(`syllabuses: ${artifact.records.syllabuses.length}`)
console.log(`syllabusSubTopics: ${artifact.records.syllabusSubTopics.length}`)
console.log(`questions: ${artifact.records.questions.length}`)

function exportMedia(media: Media): ExportedMedia {
  return {
    alt: media.alt,
    createdAt: media.createdAt,
    filename: media.filename,
    filesize: media.filesize,
    focalX: media.focalX,
    focalY: media.focalY,
    height: media.height,
    id: legacyRecordId(media.id, `media ${media.id}`),
    mimeType: media.mimeType,
    thumbnailURL: media.thumbnailURL,
    updatedAt: media.updatedAt,
    url: media.url,
    width: media.width,
  }
}

function exportQuestion(question: Question): ExportedQuestion {
  const { id, parts, subTopics, ...questionData } = question

  return {
    ...questionData,
    id: legacyRecordId(id, `question ${id}`),
    parts: parts.map(exportQuestionPart),
    subTopics: optionalLegacyRelationshipIds(subTopics, `question ${id}.subTopics`),
  }
}

function exportQuestionPart(part: Question['parts'][number]): ExportedQuestionPart {
  return {
    ...part,
    workedSolutions:
      part.workedSolutions?.map((workedSolution) => ({
        ...workedSolution,
        subTopics: optionalLegacyRelationshipIds(
          workedSolution.subTopics,
          `question part ${part.id ?? '<no-id>'}.workedSolutions.subTopics`,
        ),
      })) ?? null,
  }
}

function legacyRecordId(value: unknown, label: string): LegacyId {
  if (typeof value === 'number') {
    return value
  }

  throw new Error(`${label} expected a numeric root ID.`)
}
