import { describe, expect, it } from 'bun:test'

import {
  buildQuestionReviewPath,
  parseSubmittedQuestionFormData,
} from '@/app/actions/question-action-utils'

describe('question action utils', () => {
  it('parses canonical question submission form data', () => {
    const formData = new FormData()
    formData.set('questionId', '12')
    formData.set('seed', 'seed-123')
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
      questionId: 12,
      seed: 'seed-123',
    })
  })

  it('builds the seeded review URL from parsed answers', () => {
    expect(
      buildQuestionReviewPath(12, 'seed-123', {
        'part-1': 'choice-a',
        'part-2': 'x = 4',
      }),
    ).toBe('/question/12?seed=seed-123&submitted=1&a.part-1=choice-a&a.part-2=x+%3D+4')
  })
})
