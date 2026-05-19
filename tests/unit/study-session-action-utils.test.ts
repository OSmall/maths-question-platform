import { describe, expect, it } from 'bun:test'

import {
  buildStudySessionQuestionPath,
  parseStudySessionQuestionFormData,
  parseSubmittedStudySessionQuestionFormData,
  toZeroBasedQuestionIndex,
} from '@/app/actions/study-session-action-utils'

describe('study session action utils', () => {
  it('parses indexed answer rows from submitted form data', () => {
    const formData = new FormData()
    formData.set('studySessionId', '123')
    formData.set('questionNumber', '2')
    formData.set('answers.1.partId', 'part-2')
    formData.set('answers.1.type', 'shortText')
    formData.set('answers.1.value', '  x = 4  ')
    formData.set('answers.0.partId', 'part-1')
    formData.set('answers.0.type', 'multipleChoice')
    formData.set('answers.0.value', 'choice-a')
    formData.set('answers.2.partId', 'part-3')
    formData.set('answers.2.type', 'selfReport')
    formData.set('answers.2.value', 'incorrect')
    formData.set('ignored', 'value')

    expect(parseSubmittedStudySessionQuestionFormData(formData)).toEqual({
      answers: [
        { choiceId: 'choice-a', partId: 'part-1', type: 'multipleChoice' },
        { answer: '  x = 4  ', partId: 'part-2', type: 'shortText' },
        { answer: false, partId: 'part-3', type: 'selfReport' },
      ],
      questionNumber: 2,
      studySessionId: 123,
    })
  })

  it('omits unanswered radio rows so the service can return an incomplete-answer business error', () => {
    const formData = new FormData()
    formData.set('studySessionId', '123')
    formData.set('questionNumber', '2')
    formData.set('answers.0.partId', 'part-1')
    formData.set('answers.0.type', 'multipleChoice')
    formData.set('answers.1.partId', 'part-2')
    formData.set('answers.1.type', 'shortText')
    formData.set('answers.1.value', '')

    expect(parseSubmittedStudySessionQuestionFormData(formData).answers).toEqual([
      { answer: '', partId: 'part-2', type: 'shortText' },
    ])
  })

  it('parses StudySession question form identity for skip actions', () => {
    const formData = new FormData()
    formData.set('studySessionId', '123')
    formData.set('questionNumber', '2')

    expect(parseStudySessionQuestionFormData(formData)).toEqual({
      questionNumber: 2,
      studySessionId: 123,
    })
  })

  it('rejects missing StudySession identity fields from form data', () => {
    const missingSessionId = new FormData()
    missingSessionId.set('questionNumber', '2')

    const missingQuestionNumber = new FormData()
    missingQuestionNumber.set('studySessionId', '123')

    expect(() => parseStudySessionQuestionFormData(missingSessionId)).toThrow()
    expect(() => parseStudySessionQuestionFormData(missingQuestionNumber)).toThrow()
  })

  it('rejects invalid numeric StudySession identity fields from form data', () => {
    for (const studySessionId of ['not-a-number', '1.5', '0', '-1']) {
      const formData = new FormData()
      formData.set('studySessionId', studySessionId)
      formData.set('questionNumber', '2')

      expect(() => parseStudySessionQuestionFormData(formData)).toThrow()
    }

    for (const questionNumber of ['not-a-number', '1.5', '0', '-1']) {
      const formData = new FormData()
      formData.set('studySessionId', '123')
      formData.set('questionNumber', questionNumber)

      expect(() => parseStudySessionQuestionFormData(formData)).toThrow()
    }
  })

  it('rejects invalid StudySession identity fields from submitted answer form data', () => {
    const formData = new FormData()
    formData.set('studySessionId', 'not-a-number')
    formData.set('questionNumber', '2')
    formData.set('answers.0.partId', 'part-1')
    formData.set('answers.0.type', 'multipleChoice')
    formData.set('answers.0.value', 'choice-a')

    expect(() => parseSubmittedStudySessionQuestionFormData(formData)).toThrow()
  })

  it('builds one-based StudySession question paths and converts to zero-based indexes', () => {
    expect(buildStudySessionQuestionPath(123, 1)).toBe('/study-session/123/question/1')
    expect(buildStudySessionQuestionPath(123, 2)).toBe('/study-session/123/question/2')
    expect(toZeroBasedQuestionIndex(1)).toBe(0)
    expect(toZeroBasedQuestionIndex(2)).toBe(1)
  })
})
