import { describe, expect, it } from 'bun:test'

import {
  buildBlankQuestionDraftData,
  buildStarterQuestionDraftData,
  extractSubTopicIDs,
} from '@/payload/components/admin/question-authoring-utils'

describe('question authoring utils', () => {
  it('extracts canonical subtopic ids from mixed relationship values', () => {
    expect(
      extractSubTopicIDs([12, '18', { id: 4 }, { value: '9' }, { id: 4 }, { value: 'nope' }, null]),
    ).toEqual([12, 18, 4, 9])
  })

  it('builds a blank draft payload with normalized subtopic ids', () => {
    expect(buildBlankQuestionDraftData([5, 7, 5, 0])).toEqual({
      _status: 'draft',
      subTopics: [5, 7],
    })
  })

  it('builds a minimal starter draft payload when a blank draft is rejected', () => {
    expect(buildStarterQuestionDraftData([3, 3])).toEqual({
      _status: 'draft',
      parts: [{}],
      subTopics: [3],
    })
  })

  it('omits subtopics when there are no valid ids to carry forward', () => {
    expect(buildBlankQuestionDraftData([0, -2])).toEqual({
      _status: 'draft',
    })
  })
})
