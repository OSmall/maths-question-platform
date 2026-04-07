import { queryPayloadForQuestionAttemptByIdAndDraftResult } from '@/lib/repository/question-repository'
import { ok } from 'neverthrow'
import { payloadQuestionToAttemptCandidate } from '../data/question-mapper'
import { QuestionNotRenderableError } from '../errors'
import { parseToResult } from '../utils/validation'
import { renderableQuestionSchema } from '../domain/question'

type GetQuestionByIdOptions = {
  draft?: boolean
  seed: string
}

export function getQuestionById(id: number, options: GetQuestionByIdOptions) {
  const isDraft = options.draft ?? false

  return ok(id)
    .asyncAndThen((id) => queryPayloadForQuestionAttemptByIdAndDraftResult(id, isDraft))
    .map(payloadQuestionToAttemptCandidate)
    .map((question) => ({
      ...question,
      seed: options.seed,
    }))
    .andThen((candidateQuestion) =>
      parseToResult(renderableQuestionSchema, candidateQuestion).mapErr(
        (error) => new QuestionNotRenderableError(error),
      ),
    )
}
