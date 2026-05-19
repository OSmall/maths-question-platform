import { getStudySessionQuestionByIndex, skipStudySessionQuestion } from '@/lib/service/study-session-service'

import { assertEqual, assertPayloadId, assertRecord, assertRelationshipResolves } from '../assertions'
import type { SmokeFixture, SmokeId } from '../types'

export const studySessionFixture: SmokeFixture = {
  name: 'studySession',
  async create(context) {
    const question = assertRecord(context.records.question, 'Question')
    const user = assertRecord(context.records.user, 'User')

    context.records.studySession = await context.payload.create({
      collection: 'studySession',
      data: {
        questions: [
          {
            answers: [{ partId: 'pending-lock', type: 'unanswered' }],
            flagged: false,
            question: question.id,
            questionVersionId: 'pending-lock',
            status: 'notStarted',
          },
        ],
        state: 'started',
        user: user.id,
      },
      depth: 0,
      draft: false,
    })
  },
  async verify(context) {
    const question = assertRecord(context.records.question, 'Question')
    const studySession = assertRecord(context.records.studySession, 'Study session')
    const user = assertRecord(context.records.user, 'User')
    assertPayloadId(studySession.id, 'Study session ID', context.expectedPayloadIdType)
    assertEqual(studySession.user, user.id, 'Study session depth: 0 user relationship')
    assertEqual(
      studySession.questions[0]?.question,
      question.id,
      'Study session depth: 0 question relationship',
    )

    await assertRelationshipResolves(context, {
      collection: 'studySession',
      id: studySession.id,
      label: 'Study session relationships',
      predicate: (document) => {
        const candidate = document as {
          questions?: { question?: { id?: SmokeId } }[]
          user?: { id?: SmokeId }
        }
        return candidate.user?.id === user.id && candidate.questions?.[0]?.question?.id === question.id
      },
    })

    if (typeof studySession.id !== 'number') {
      throw new Error('Study session service smoke path still expects numeric IDs.')
    }

    const loaded = await getStudySessionQuestionByIndex(studySession.id, 0)
    if (loaded.isErr()) {
      throw loaded.error
    }

    const skipped = await skipStudySessionQuestion(studySession.id, 0)
    if (skipped.isErr()) {
      throw skipped.error
    }
    assertEqual(skipped.value.questions[0]?.status, 'skipped', 'Study session service skip status')
  },
}
