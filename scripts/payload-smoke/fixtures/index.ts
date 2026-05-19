import { mediaFixture } from './media'
import { questionFixture } from './question'
import { studySessionFixture } from './study-session'
import { syllabusFixture, syllabusSubTopicFixture } from './syllabus'
import { subTopicFixture, topicFixture } from './taxonomy'
import { usersFixture } from './users'
import type { SmokeFixture } from '../types'

export const smokeFixtures: SmokeFixture[] = [
  usersFixture,
  topicFixture,
  subTopicFixture,
  syllabusFixture,
  syllabusSubTopicFixture,
  questionFixture,
  studySessionFixture,
  mediaFixture,
]
