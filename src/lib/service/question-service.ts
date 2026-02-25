import { fetchQuestionById } from '@/lib/repository/question-repository'
import { err, ok } from 'neverthrow'
import { NotANumberError } from '@/lib/errors'

export function getQuestionById(id: string) {
  return ok(id)
    .andThen((id) => {
      const idNumber = Number(id)
      return isNaN(idNumber) ? err(new NotANumberError(id)) : ok(idNumber)
    })
    .asyncAndThen(fetchQuestionById)
}
