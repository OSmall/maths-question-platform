import { fetchRenderableQuestionByIdAndDraft } from '@/lib/repository/question-repository'
import { err, ok } from 'neverthrow'
import { NotANumberError } from '@/lib/errors'

type GetQuestionByIdOptions = {
  draft?: boolean
}

export function getQuestionById(id: string, options: GetQuestionByIdOptions = {}) {
  const isDraft = options.draft ?? false

  return ok(id)
    .andThen((id) => {
      const idNumber = Number(id)
      return isNaN(idNumber) ? err(new NotANumberError(id)) : ok(idNumber)
    })
    .asyncAndThen((idNumber) => fetchRenderableQuestionByIdAndDraft(idNumber, isDraft))
}
