import { queryPayloadForQuestionAttemptByIdAndDraftAsync } from '@/lib/repository/question-repository'
import { ok } from 'neverthrow'
import { payloadQuestionToAttemptCandidate } from '../data/question-mapper'
import { parseToResult } from '../utils/validation'
import { renderableQuestionSchema } from '../domain/question'

type GetQuestionByIdOptions = {
  draft?: boolean
  seed: string
}

export function getQuestionById(id: number, options: GetQuestionByIdOptions) {
  const isDraft = options.draft ?? false

  return ok(id)
    .asyncAndThen((id) => queryPayloadForQuestionAttemptByIdAndDraftAsync(id, isDraft))
    .map(payloadQuestionToAttemptCandidate)
    .map((question) => ({
      ...question,
      seed: options.seed,
    }))
    .andTee((question) => console.debug(`question candidate object is ${JSON.stringify(question)}`))
    .andThen((candidateQuestion) => parseToResult(renderableQuestionSchema, candidateQuestion))
}
