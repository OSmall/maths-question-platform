import type {
  Media,
  Question,
  SubTopic,
  Syllabus,
  SyllabusSubTopic,
  Topic,
  User,
} from '@/payload/payload-types'

export type LegacyId = number
export type ImportedId = number | string

export type TransferCollection =
  | 'media'
  | 'question'
  | 'subTopic'
  | 'syllabus'
  | 'syllabusSubTopic'
  | 'topic'
  | 'users'

export type ExportedUser = Pick<
  User,
  | 'createdAt'
  | 'email'
  | 'hash'
  | 'lockUntil'
  | 'loginAttempts'
  | 'resetPasswordExpiration'
  | 'resetPasswordToken'
  | 'roles'
  | 'salt'
  | 'updatedAt'
> & {
  id: LegacyId
}

export type ExportedMedia = Pick<
  Media,
  | 'alt'
  | 'createdAt'
  | 'filename'
  | 'filesize'
  | 'focalX'
  | 'focalY'
  | 'height'
  | 'mimeType'
  | 'thumbnailURL'
  | 'updatedAt'
  | 'url'
  | 'width'
> & {
  id: LegacyId
}

export type ExportedTopic = Pick<Topic, 'createdAt' | 'name' | 'updatedAt'> & {
  id: LegacyId
}

export type ExportedSubTopic = Pick<SubTopic, 'createdAt' | 'name' | 'updatedAt'> & {
  id: LegacyId
  topic: LegacyId
}

export type ExportedSyllabus = Pick<Syllabus, 'createdAt' | 'name' | 'updatedAt'> & {
  id: LegacyId
}

export type ExportedSyllabusSubTopic = Pick<
  SyllabusSubTopic,
  'createdAt' | 'status' | 'updatedAt'
> & {
  id: LegacyId
  subTopic: LegacyId
  syllabus: LegacyId
}

export type ExportedQuestionPart = Omit<Question['parts'][number], 'workedSolutions'> & {
  workedSolutions?:
    | (Omit<NonNullable<Question['parts'][number]['workedSolutions']>[number], 'subTopics'> & {
        subTopics?: LegacyId[] | null
      })[]
    | null
}

export type ExportedQuestion = Omit<Question, 'id' | 'subTopics' | 'parts'> & {
  id: LegacyId
  parts: ExportedQuestionPart[]
  subTopics?: LegacyId[] | null
}

export type PayloadExportArtifact = {
  exportedAt: string
  records: {
    media: ExportedMedia[]
    questions: ExportedQuestion[]
    subTopics: ExportedSubTopic[]
    syllabuses: ExportedSyllabus[]
    syllabusSubTopics: ExportedSyllabusSubTopic[]
    topics: ExportedTopic[]
    users: ExportedUser[]
  }
  schemaVersion: 1
}

export type CollectionIdMap = Record<string, ImportedId>

export type PayloadImportMapArtifact = {
  exportedAt: string
  importFinishedAt: string
  sourceExportPath: string
  maps: Record<TransferCollection, CollectionIdMap>
  schemaVersion: 1
}
