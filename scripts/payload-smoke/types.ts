import type { Payload } from 'payload'

import type {
  Media,
  Question,
  StudySession,
  SubTopic,
  Syllabus,
  SyllabusSubTopic,
  Topic,
  User,
} from '@/payload/payload-types'

export type SmokeId = number | string

export type ExpectedPayloadIdType = 'number' | 'uuid'

export type SmokeRecords = {
  media?: Media
  question?: Question
  questionVersionId?: string
  studySession?: StudySession
  subTopic?: SubTopic
  syllabus?: Syllabus
  syllabusSubTopic?: SyllabusSubTopic
  topic?: Topic
  user?: User
}

export type SmokeContext = {
  expectedPayloadIdType: ExpectedPayloadIdType
  marker: string
  payload: Payload
  records: SmokeRecords
}

export type SmokeFixture = {
  create: (context: SmokeContext) => Promise<void>
  name: string
  verify: (context: SmokeContext) => Promise<void>
}
