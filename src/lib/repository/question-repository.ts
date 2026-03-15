import { getPayload, NotFound } from 'payload'
import config from '@payload-config'
import { payloadQuestionToDomain } from '@/lib/data/question-mapper'
import { QuestionSelect } from '@/payload/payload-types'
import { ResultAsync } from 'neverthrow'
import { NotFoundError, PayloadQueryError } from '@/lib/errors'

export function fetchQuestionByIdAndDraft(id: number, draft: boolean) {
  return queryPayloadForQuestionByIdAndDraftResultAsync(id, draft).andThen(payloadQuestionToDomain)
}

function queryPayloadForQuestionByIdAndDraftResultAsync(id: number, draft = false) {
  return ResultAsync.fromPromise(queryPayloadForQuestionByIdAndDraft(id, draft), (err) => {
    if (err instanceof NotFound) {
      return new NotFoundError('Question', id, { cause: err })
    } else {
      return new PayloadQueryError(err)
    }
  })
}

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

async function queryPayloadForQuestionByIdAndDraft(id: number, draft: boolean) {
  const payload = await getPayload({ config })
  return payload
    .findByID({
      collection: 'question',
      id: id,
      draft,
      depth: 1,
      populate: {
        media: {
          alt: true,
          filename: true,
          height: true,
          mimeType: true,
          url: true,
          width: true,
        },
      },
      select: questionSelect,
    })
    .then((question) => {
      console.trace(`question retrieved: ${JSON.stringify(question)}`)
      return question
    })
}

export type PayloadQuestionForDomain = Awaited<
  ReturnType<typeof queryPayloadForQuestionByIdAndDraft>
>
