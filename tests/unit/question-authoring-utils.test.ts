import { describe, expect, it } from 'bun:test'

import {
  buildBlankQuestionDraftData,
  buildStarterQuestionDraftData,
  extractSubTopicIDs,
} from '@/payload/components/admin/question-authoring-utils'
import { parseUUID } from '@/lib/domain/uuid'

const subTopicA = parseUUID('018f5f53-5c65-7a29-9b8d-9f8f9b9f9a04')
const subTopicB = parseUUID('018f5f53-5c65-7a29-9b8d-9f8f9b9f9a05')
const subTopicC = parseUUID('018f5f53-5c65-7a29-9b8d-9f8f9b9f9a06')

describe('question authoring utils', () => {
  it('extracts canonical subtopic ids from mixed relationship values', () => {
    expect(
      extractSubTopicIDs([12, subTopicA, { id: 4 }, { value: subTopicB }, { id: subTopicA }, { value: '' }, null]),
    ).toEqual([subTopicA, subTopicB])
  })

  it('builds a blank draft payload with normalized subtopic ids', () => {
    expect(buildBlankQuestionDraftData([subTopicA, subTopicB, subTopicA])).toEqual({
      _status: 'draft',
      subTopics: [subTopicA, subTopicB],
    })
  })

  it('builds a minimal starter draft payload when a blank draft is rejected', () => {
    expect(buildStarterQuestionDraftData([subTopicC, subTopicC])).toEqual({
      _status: 'draft',
      parts: [{}],
      subTopics: [subTopicC],
    })
  })

  it('omits subtopics when there are no valid ids to carry forward', () => {
    expect(buildBlankQuestionDraftData([])).toEqual({
      _status: 'draft',
    })
  })
})
