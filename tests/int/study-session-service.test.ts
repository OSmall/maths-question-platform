import { describe, expect, it } from 'bun:test'
import { getPayload } from 'payload'

import { USER_ROLES, type UserRole } from '@/lib/auth/roles'
import {
  NotFoundError,
  PayloadQueryError,
  StudySessionQuestionAlreadyAnsweredError,
  StudySessionQuestionIncompleteAnswerError,
  StudySessionQuestionInvalidAnswerError,
  StudySessionQuestionIndexError,
  StudySessionUnsupportedStateError,
} from '@/lib/errors'
import {
  getStudySessionQuestionByIndex,
  setStudySessionQuestionFlagged,
  skipStudySessionQuestion,
  submitStudySessionQuestionAnswers,
  type StudySessionAnswerSubmission,
} from '@/lib/service/study-session-service'
import type { Question, User } from '@/payload/payload-types'
import config from '@payload-config'

type QuestionKind = 'multipleChoice' | 'selfReport' | 'shortText'

describe('study session service integration', () => {
  it('confirms Payload returns locked question versions with documented parent and part data shape', async () => {
    const payload = await getPayload({ config })
    const { questions, session } = await createStudySessionFixture([{ kind: 'multipleChoice' }])
    const question = requireQuestion(questions[0])
    const sessionQuestion = session.questions[0]

    expect(sessionQuestion?.question).toBe(question.id)
    expect(typeof sessionQuestion?.questionVersionId).toBe('string')

    const lockedVersion = await payload.findVersionByID({
      collection: 'question',
      id: sessionQuestion?.questionVersionId ?? '',
      depth: 2,
    })

    expect(lockedVersion.parent).toBe(question.id)
    expect(lockedVersion.version.parts).toHaveLength(1)
    expect(lockedVersion.version.parts[0]?.id).toEqual(expect.any(String))
    expect(lockedVersion.version.parts[0]?.response.type).toBe('multipleChoice')
    expect(lockedVersion.version.parts[0]?.response.multipleChoice?.choices).toHaveLength(2)
    expect(lockedVersion.version.parts[0]?.response.multipleChoice?.choices?.[0]?.id).toEqual(
      expect.any(String),
    )
  }, 60_000)

  it('loads a session question with locked render data and unanswered evaluation', async () => {
    const { session, questions } = await createStudySessionFixture([{ kind: 'multipleChoice' }])
    const question = requireQuestion(questions[0])
    const mcPart = getPart(question, 0)
    const firstChoice = getChoice(mcPart, 0)
    const secondChoice = getChoice(mcPart, 1)

    const result = await getStudySessionQuestionByIndex(session.id, 0)

    if (result.isErr()) {
      throw result.error
    }
    expect(result.isOk()).toBe(true)

    expect(result.value.session).toMatchObject({
      id: session.id,
      state: 'started',
    })
    expect(result.value.studySessionQuestion).toMatchObject({
      index: 0,
      questionId: questions[0]?.id,
      status: 'notStarted',
      flagged: false,
      answers: [{ partId: mcPart.id, type: 'unanswered' }],
    })
    expect(result.value.question).toMatchObject({
      id: questions[0]?.id,
      index: 0,
      shuffleKeyBase: `${session.id}:0:${questions[0]?.id}`,
      parts: [
        {
          id: mcPart.id,
          response: {
            type: 'multipleChoice',
            choices: {
              [firstChoice.id ?? '']: { id: firstChoice.id, text: '3' },
              [secondChoice.id ?? '']: { id: secondChoice.id, text: '4' },
            },
            shuffle: false,
          },
        },
      ],
    })
    expect(result.value.questionSubmissionEvaluation).toEqual({
      isEvaluated: false,
      answeredParts: 0,
      parts: {
        [mcPart.id ?? '']: { type: 'multipleChoice' },
      },
    })
  }, 60_000)

  it('submits multipart answers across all response types and evaluates the persisted attempt', async () => {
    const now = new Date('2026-05-04T10:11:12.000Z')
    const { questions, session } = await createStudySessionFixture([{ kind: 'multipart' }])
    const question = requireQuestion(questions[0])
    const mcPart = getPart(question, 0)
    const shortPart = getPart(question, 1)
    const selfPart = getPart(question, 2)
    const correctChoice = getChoice(mcPart, 1)

    const submitResult = await submitStudySessionQuestionAnswers(
      session.id,
      0,
      [
        { partId: mcPart.id, type: 'multipleChoice', choiceId: correctChoice.id },
        { partId: shortPart.id, type: 'shortText', answer: '42' },
        { partId: selfPart.id, type: 'selfReport', answer: false },
      ],
      { now },
    )

    expect(submitResult.isOk()).toBe(true)
    if (submitResult.isErr()) {
      throw submitResult.error
    }

    expect(submitResult.value).toMatchObject({
      state: 'finished',
      endedAt: now.toISOString(),
      questions: [
        {
          status: 'answered',
          answeredAt: now.toISOString(),
          skippedAt: undefined,
          answers: [
            { partId: mcPart.id, type: 'multipleChoice', choiceId: correctChoice.id },
            { partId: shortPart.id, type: 'shortText', answer: '42' },
            { partId: selfPart.id, type: 'selfReport', answer: false },
          ],
        },
      ],
    })

    const reviewResult = await getStudySessionQuestionByIndex(session.id, 0)
    if (reviewResult.isErr()) {
      throw reviewResult.error
    }
    expect(reviewResult.isOk()).toBe(true)

    expect(reviewResult.value.questionSubmissionEvaluation).toMatchObject({
      isEvaluated: true,
      answeredParts: 3,
      correctParts: 2,
      incorrectParts: 1,
      parts: {
        [mcPart.id ?? '']: {
          type: 'multipleChoice',
          givenChoiceId: correctChoice.id,
          correctChoiceId: correctChoice.id,
          isCorrect: true,
        },
        [shortPart.id ?? '']: {
          type: 'shortText',
          givenResponse: '42',
          correctResponses: ['42'],
          isCorrect: true,
        },
        [selfPart.id ?? '']: {
          type: 'selfReport',
          givenResponse: false,
          isCorrect: false,
        },
      },
    })
  }, 60_000)

  it('loads a question from a multi-question session before any answer is submitted', async () => {
    const { questions, session } = await createStudySessionFixture([
      { kind: 'multipleChoice' },
      { kind: 'shortText' },
    ])
    const firstQuestion = requireQuestion(questions[0])

    const result = await getStudySessionQuestionByIndex(session.id, 0)

    if (result.isErr()) {
      throw result.error
    }

    expect(result.value.studySessionQuestion.questionId).toBe(firstQuestion.id)
    expect(result.value.studySessionQuestion.status).toBe('notStarted')
    expect(result.value.session.state).toBe('started')
  }, 60_000)

  it('keeps a session started after a non-final answer', async () => {
    const now = new Date('2026-05-04T10:11:12.000Z')
    const { questions, session } = await createStudySessionFixture([
      { kind: 'multipleChoice' },
      { kind: 'shortText' },
    ])
    const mcPart = getPart(requireQuestion(questions[0]), 0)
    const correctChoice = getChoice(mcPart, 1)

    const result = await submitStudySessionQuestionAnswers(
      session.id,
      0,
      [{ partId: mcPart.id, type: 'multipleChoice', choiceId: correctChoice.id }],
      { now },
    )

    expect(result.isOk()).toBe(true)
    if (result.isErr()) {
      throw result.error
    }

    expect(result.value.state).toBe('started')
    expect(result.value.endedAt).toBeUndefined()
    expect(result.value.questions).toMatchObject([
      {
        status: 'answered',
        answeredAt: now.toISOString(),
        skippedAt: undefined,
      },
      {
        status: 'notStarted',
      },
    ])
  }, 60_000)

  it('skips an unanswered question with unanswered rows and leaves the session open', async () => {
    const now = new Date('2026-05-04T10:11:12.000Z')
    const { questions, session } = await createStudySessionFixture([{ kind: 'shortText' }])
    const shortPart = getPart(requireQuestion(questions[0]), 0)

    const result = await skipStudySessionQuestion(session.id, 0, { now })

    expect(result.isOk()).toBe(true)
    if (result.isErr()) {
      throw result.error
    }

    expect(result.value).toMatchObject({
      state: 'started',
      endedAt: undefined,
      questions: [
        {
          status: 'skipped',
          answeredAt: undefined,
          skippedAt: now.toISOString(),
          answers: [{ partId: shortPart.id, type: 'unanswered' }],
        },
      ],
    })
  }, 60_000)

  it('answers a previously skipped question and clears skippedAt after reload', async () => {
    const skippedAt = new Date('2026-05-04T10:11:12.000Z')
    const answeredAt = new Date('2026-05-04T10:12:12.000Z')
    const { questions, session } = await createStudySessionFixture([{ kind: 'multipleChoice' }])
    const mcPart = getPart(requireQuestion(questions[0]), 0)
    const correctChoice = getChoice(mcPart, 0)

    const skipResult = await skipStudySessionQuestion(session.id, 0, { now: skippedAt })
    if (skipResult.isErr()) {
      throw skipResult.error
    }

    const answerResult = await submitStudySessionQuestionAnswers(
      session.id,
      0,
      [{ partId: mcPart.id, type: 'multipleChoice', choiceId: correctChoice.id }],
      { now: answeredAt },
    )
    if (answerResult.isErr()) {
      throw answerResult.error
    }

    expect(answerResult.value.questions[0]).toMatchObject({
      status: 'answered',
      answeredAt: answeredAt.toISOString(),
      skippedAt: undefined,
    })

    const reloadResult = await getStudySessionQuestionByIndex(session.id, 0)
    if (reloadResult.isErr()) {
      throw reloadResult.error
    }

    expect(reloadResult.value.studySessionQuestion).toMatchObject({
      status: 'answered',
      answeredAt: answeredAt.toISOString(),
      skippedAt: undefined,
    })
  }, 60_000)

  it('sets the requested flagged state without toggling', async () => {
    const { session } = await createStudySessionFixture([{ kind: 'multipleChoice' }])

    const flaggedResult = await setStudySessionQuestionFlagged(session.id, 0, true)

    expect(flaggedResult.isOk()).toBe(true)
    if (flaggedResult.isErr()) {
      throw flaggedResult.error
    }

    const flaggedReloadResult = await getStudySessionQuestionByIndex(session.id, 0)
    if (flaggedReloadResult.isErr()) {
      throw flaggedReloadResult.error
    }

    const unflaggedResult = await setStudySessionQuestionFlagged(session.id, 0, false)

    expect(unflaggedResult.isOk()).toBe(true)
    if (unflaggedResult.isErr()) {
      throw unflaggedResult.error
    }

    const unflaggedReloadResult = await getStudySessionQuestionByIndex(session.id, 0)
    if (unflaggedReloadResult.isErr()) {
      throw unflaggedReloadResult.error
    }

    expect(flaggedResult.value.flagged).toBe(true)
    expect(flaggedReloadResult.value.studySessionQuestion.flagged).toBe(true)
    expect(unflaggedResult.value.flagged).toBe(false)
    expect(unflaggedReloadResult.value.studySessionQuestion.flagged).toBe(false)
  }, 60_000)

  it('enforces owner access when a user is supplied', async () => {
    const owner = await createUser([USER_ROLES.student])
    const stranger = await createUser([USER_ROLES.student])
    const { session } = await createStudySessionFixture([{ kind: 'multipleChoice' }], {
      user: owner,
    })

    const ownerResult = await getStudySessionQuestionByIndex(session.id, 0, { user: owner })
    const strangerResult = await getStudySessionQuestionByIndex(session.id, 0, { user: stranger })

    expect(ownerResult.isOk()).toBe(true)
    expect(strangerResult.isErr()).toBe(true)
    if (strangerResult.isOk()) {
      throw new Error('Expected non-owner access to fail')
    }
    expect(
      strangerResult.error instanceof NotFoundError ||
        strangerResult.error instanceof PayloadQueryError,
    ).toBe(true)
  }, 60_000)

  it('rejects get, submit, skip, and flag operations for out-of-range indexes', async () => {
    const { questions, session } = await createStudySessionFixture([{ kind: 'multipleChoice' }])
    const mcPart = getPart(requireQuestion(questions[0]), 0)
    const correctChoice = getChoice(mcPart, 1)

    const getResult = await getStudySessionQuestionByIndex(session.id, 1)
    const submitResult = await submitStudySessionQuestionAnswers(session.id, 1, [
      { partId: mcPart.id, type: 'multipleChoice', choiceId: correctChoice.id },
    ])
    const skipResult = await skipStudySessionQuestion(session.id, 1)
    const flagResult = await setStudySessionQuestionFlagged(session.id, 1, true)

    expect(getResult.isErr()).toBe(true)
    expect(submitResult.isErr()).toBe(true)
    expect(skipResult.isErr()).toBe(true)
    expect(flagResult.isErr()).toBe(true)

    if (getResult.isOk() || submitResult.isOk() || skipResult.isOk() || flagResult.isOk()) {
      throw new Error('Expected all index operations to fail')
    }

    expect(getResult.error).toBeInstanceOf(StudySessionQuestionIndexError)
    expect(submitResult.error).toBeInstanceOf(StudySessionQuestionIndexError)
    expect(skipResult.error).toBeInstanceOf(StudySessionQuestionIndexError)
    expect(flagResult.error).toBeInstanceOf(StudySessionQuestionIndexError)
  }, 60_000)

  it('rejects loading a question from a not-started session', async () => {
    const payload = await getPayload({ config })
    const { session } = await createStudySessionFixture([{ kind: 'multipleChoice' }])
    await payload.update({
      collection: 'studySession',
      id: session.id,
      data: {
        state: 'notStarted',
      },
    })

    const result = await getStudySessionQuestionByIndex(session.id, 0)

    expect(result.isErr()).toBe(true)
    if (result.isOk()) {
      throw new Error('Expected unsupported state error')
    }
    expect(result.error).toBeInstanceOf(StudySessionUnsupportedStateError)
  }, 60_000)

  it('rejects submit and skip after a question has already been answered', async () => {
    const { questions, session } = await createStudySessionFixture([{ kind: 'multipleChoice' }])
    const mcPart = getPart(requireQuestion(questions[0]), 0)
    const correctChoice = getChoice(mcPart, 1)
    const firstSubmit = await submitStudySessionQuestionAnswers(session.id, 0, [
      { partId: mcPart.id, type: 'multipleChoice', choiceId: correctChoice.id },
    ])

    expect(firstSubmit.isOk()).toBe(true)

    const secondSubmit = await submitStudySessionQuestionAnswers(session.id, 0, [
      { partId: mcPart.id, type: 'multipleChoice', choiceId: correctChoice.id },
    ])
    const skipResult = await skipStudySessionQuestion(session.id, 0)

    expect(secondSubmit.isErr()).toBe(true)
    expect(skipResult.isErr()).toBe(true)
    if (secondSubmit.isOk() || skipResult.isOk()) {
      throw new Error('Expected answered question operations to fail')
    }
    expect(secondSubmit.error).toBeInstanceOf(StudySessionQuestionAlreadyAnsweredError)
    expect(skipResult.error).toBeInstanceOf(StudySessionQuestionAlreadyAnsweredError)
  }, 60_000)

  it('returns incomplete-answer errors for missing and blank required answers', async () => {
    const { questions: missingQuestions, session: missingSession } =
      await createStudySessionFixture([{ kind: 'multipart' }])
    const { questions: blankQuestions, session: blankSession } = await createStudySessionFixture([
      { kind: 'shortText' },
    ])
    const missingQuestion = requireQuestion(missingQuestions[0])
    const missingMcPart = getPart(missingQuestion, 0)
    const missingShortPart = getPart(missingQuestion, 1)
    const missingSelfPart = getPart(missingQuestion, 2)
    const blankShortPart = getPart(requireQuestion(blankQuestions[0]), 0)
    const correctChoice = getChoice(missingMcPart, 1)

    const missingResult = await submitStudySessionQuestionAnswers(missingSession.id, 0, [
      { partId: missingMcPart.id, type: 'multipleChoice', choiceId: correctChoice.id },
    ])
    const blankResult = await submitStudySessionQuestionAnswers(blankSession.id, 0, [
      { partId: blankShortPart.id, type: 'shortText', answer: '   ' },
    ])

    expect(missingResult.isErr()).toBe(true)
    expect(blankResult.isErr()).toBe(true)
    if (missingResult.isOk() || blankResult.isOk()) {
      throw new Error('Expected incomplete answer errors')
    }
    expect(missingResult.error).toBeInstanceOf(StudySessionQuestionIncompleteAnswerError)
    expect(missingResult.error.message).toContain(`${missingShortPart.id}, ${missingSelfPart.id}`)
    expect(blankResult.error).toBeInstanceOf(StudySessionQuestionIncompleteAnswerError)
    expect(blankResult.error.message).toContain(blankShortPart.id)
  }, 60_000)

  it('rejects malformed submitted answer payloads before mutating the session', async () => {
    for (const malformedCaseName of [
      'duplicate part',
      'unknown part',
      'wrong answer type',
      'invalid choice',
    ] as const) {
      const { questions, session } = await createStudySessionFixture([{ kind: 'multipleChoice' }])
      const mcPart = getPart(requireQuestion(questions[0]), 0)
      const correctChoice = getChoice(mcPart, 1)
      const malformedCase = buildMalformedAnswerCase(malformedCaseName, mcPart.id, correctChoice.id)

      const result = await submitStudySessionQuestionAnswers(session.id, 0, malformedCase.answers)

      expect(result.isErr(), malformedCase.name).toBe(true)
      if (result.isOk()) {
        throw new Error('Expected malformed answer submission to fail')
      }
      expect(result.error, malformedCase.name).toBeInstanceOf(
        StudySessionQuestionInvalidAnswerError,
      )
      expect(result.error.message, malformedCase.name).toContain(malformedCase.expectedMessage)

      const loadedResult = await getStudySessionQuestionByIndex(session.id, 0)
      expect(loadedResult.isOk(), malformedCase.name).toBe(true)
      if (loadedResult.isErr()) {
        throw loadedResult.error
      }
      expect(loadedResult.value.studySessionQuestion.status, malformedCase.name).toBe('notStarted')
    }
  }, 60_000)
})

async function createStudySessionFixture(
  questionConfigs: readonly ({ kind: QuestionKind } | { kind: 'multipart' })[],
  options: { user?: User } = {},
) {
  const payload = await getPayload({ config })
  const user = options.user ?? (await createUser([USER_ROLES.student]))
  const questions: Question[] = []
  for (const questionConfig of questionConfigs) {
    questions.push(
      questionConfig.kind === 'multipart'
        ? await createMultipartQuestion()
        : await createQuestion(questionConfig.kind),
    )
  }

  const session = await payload.create({
    collection: 'studySession',
    data: {
      state: 'started',
      user: user.id,
      questions: questions.map((question) => ({
        question: question.id,
        questionVersionId: 'pending-lock',
        status: 'notStarted' as const,
        flagged: false,
        answers: [{ partId: 'pending-lock', type: 'unanswered' as const }],
      })),
    },
    depth: 0,
    draft: false,
  })

  return { questions, session, user }
}

async function createUser(roles: UserRole[]) {
  const payload = await getPayload({ config })
  const uniqueId = crypto.randomUUID()
  const now = new Date().toISOString()

  return payload.db.create({
    collection: 'users',
    data: {
      email: `study-session-${uniqueId}@example.com`,
      createdAt: now,
      updatedAt: now,
      roles,
    },
  }) as Promise<User>
}

async function createQuestion(kind: QuestionKind) {
  return createPublishedQuestion({
    parts: [createQuestionPart(kind)],
  })
}

async function createMultipartQuestion() {
  return createPublishedQuestion({
    parts: [
      createQuestionPart('multipleChoice'),
      createQuestionPart('shortText'),
      createQuestionPart('selfReport'),
    ],
  })
}

async function createPublishedQuestion(data: Pick<Question, 'parts'>) {
  const payload = await getPayload({ config })

  return payload.create({
    collection: 'question',
    data: {
      prompt: nonEmptyRichText,
      parts: data.parts,
      _status: 'published',
    },
    depth: 0,
  })
}

function createQuestionPart(kind: QuestionKind): Question['parts'][number] {
  const idSuffix = crypto.randomUUID()

  switch (kind) {
    case 'multipleChoice':
      return {
        id: `mc-part-${idSuffix}`,
        prompt: nonEmptyRichText,
        response: {
          type: 'multipleChoice',
          multipleChoice: {
            choices: [
              { id: `mc-a-${idSuffix}`, text: '3', isCorrect: false },
              { id: `mc-b-${idSuffix}`, text: '4', isCorrect: true },
            ],
            shuffle: false,
          },
        },
      }
    case 'shortText':
      return {
        id: `short-part-${idSuffix}`,
        prompt: nonEmptyRichText,
        response: {
          type: 'shortText',
          shortText: {
            acceptedAnswers: [{ id: `answer-42-${idSuffix}`, value: '42' }],
          },
        },
      }
    case 'selfReport':
      return {
        id: `self-part-${idSuffix}`,
        prompt: nonEmptyRichText,
        response: {
          type: 'selfReport',
          selfReport: {},
        },
      }
  }
}

function buildMalformedAnswerCase(
  name: 'duplicate part' | 'invalid choice' | 'unknown part' | 'wrong answer type',
  partId: string,
  choiceId: string,
): { answers: StudySessionAnswerSubmission[]; expectedMessage: string; name: string } {
  switch (name) {
    case 'duplicate part':
      return {
        name,
        answers: [
          { partId, type: 'multipleChoice', choiceId },
          { partId, type: 'multipleChoice', choiceId },
        ],
        expectedMessage: `Duplicate submitted answer for part ${partId}.`,
      }
    case 'unknown part':
      return {
        name,
        answers: [
          { partId, type: 'multipleChoice', choiceId },
          { partId: 'unknown-part', type: 'selfReport', answer: true },
        ],
        expectedMessage: 'Submitted answers contain unknown parts: unknown-part.',
      }
    case 'wrong answer type':
      return {
        name,
        answers: [{ partId, type: 'shortText', answer: '4' }],
        expectedMessage: `Submitted answer for part ${partId} has type shortText; expected multipleChoice.`,
      }
    case 'invalid choice':
      return {
        name,
        answers: [{ partId, type: 'multipleChoice', choiceId: 'not-a-choice' }],
        expectedMessage: `Submitted answer for part ${partId} has invalid choice not-a-choice.`,
      }
  }
}

function requireQuestion(question: Question | undefined): Question {
  if (!question) {
    throw new Error('Expected test question to exist.')
  }

  return question
}

function getPart(question: Question, index: number): Question['parts'][number] & { id: string } {
  const part = question.parts[index]
  if (!part?.id) {
    throw new Error(`Expected question part ${index} to exist.`)
  }

  return part as Question['parts'][number] & { id: string }
}

function getChoice(
  part: Question['parts'][number],
  index: number,
): NonNullable<NonNullable<typeof part.response.multipleChoice>['choices']>[number] & {
  id: string
} {
  const choice = part.response.multipleChoice?.choices?.[index]
  if (!choice?.id) {
    throw new Error(`Expected multiple-choice option ${index} to exist.`)
  }

  return choice as NonNullable<
    NonNullable<typeof part.response.multipleChoice>['choices']
  >[number] & {
    id: string
  }
}

const nonEmptyRichText = {
  root: {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        version: 1,
        children: [
          {
            type: 'text',
            version: 1,
            text: 'Prompt text',
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
      },
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  },
} satisfies NonNullable<Question['prompt']>
