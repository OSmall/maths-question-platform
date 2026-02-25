import { getPayload, NotFound } from 'payload'
import config from '@payload-config'
import { payloadQuestionToDomain } from '@/lib/data/question-mapper'
import { QuestionSelect } from '@/payload/payload-types'
import { ResultAsync } from 'neverthrow'
import { NotFoundError, PayloadQueryError } from '@/lib/errors'

export function fetchQuestionById(id: number) {
  return queryPayloadForQuestionByIdResultAsync(id)
    .map(payloadQuestionToDomain)
}

function queryPayloadForQuestionByIdResultAsync(id: number) {
  return ResultAsync.fromPromise(queryPayloadForQuestionById(id), (err) => {
    if (err instanceof NotFound) {
      return new NotFoundError("Question", id, {cause: err})
    } else {
      return new PayloadQueryError(err)
    }
  })
}

async function queryPayloadForQuestionById(id: number) {
  const payload = await getPayload({ config })
  return payload
    .findByID({
      collection: 'question',
      id: id,
      depth: 0,
      select: questionSelect,
    })
    .then((question) => {
      console.trace(`question retrieved: ${JSON.stringify(question)}`)
      return question
    })
}

export type PayloadQuestionForDomain = Awaited<ReturnType<typeof queryPayloadForQuestionById>>

const questionSelect = {
  overallQuestionRichText: true,
  parts: {
    id: true,
    partRichText: true,
    answerMechanism: {
      multipleChoice: {
        answers: {
          answer: true,
        },
        shuffle: true,
      },
      selfReport: {},
      freeTextValidation: {},
    },
  },
} as const satisfies QuestionSelect
