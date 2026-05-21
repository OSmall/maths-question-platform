import { describe, expect, it } from 'bun:test'

import {
  buildQuestionReviewPath,
  parseSubmittedQuestionFormData,
} from '@/app/actions/question-action-utils'
import { parseUUID } from '@/lib/domain/uuid'

const questionId = parseUUID('018f5f53-5c65-7a29-9b8d-9f8f9b9f9a01')

describe('question action utils', () => {
  it('parses canonical question submission form data', () => {
    const formData = new FormData()
    formData.set('questionId', questionId)
    formData.set('previewStudySessionId', 'preview-session-123')
    formData.set('flagged', '1')
    formData.set('answers.1.partId', 'part-2')
    formData.set('answers.1.type', 'shortText')
    formData.set('answers.1.value', '  x = 4  ')
    formData.set('answers.0.partId', 'part-1')
    formData.set('answers.0.type', 'multipleChoice')
    formData.set('answers.0.value', 'choice-a')
    formData.set('ignored', 'value')

    expect(parseSubmittedQuestionFormData(formData)).toEqual({
      answers: {
        'part-1': 'choice-a',
        'part-2': '  x = 4  ',
      },
      flagged: true,
      questionId,
      previewStudySessionId: 'preview-session-123',
    })
  })

  it('builds the preview review URL from parsed answers', () => {
    expect(
      buildQuestionReviewPath(
        questionId,
        'preview-session-123',
        {
          'part-1': 'choice-a',
          'part-2': 'x = 4',
        },
        { flagged: true },
      ),
    ).toBe(
      `/question/${questionId}?previewStudySessionId=preview-session-123&submitted=1&flagged=1&a.part-1=choice-a&a.part-2=x+%3D+4`,
    )
  })
})
