import { NotFound } from 'payload'
import { NotFoundError, PayloadQueryError } from '@/lib/errors'

export function handleRepositoryError(entity: string, identifier: string | number) {
  return (err: unknown) => {
    if (err instanceof NotFound) {
      return new NotFoundError(entity, identifier, { cause: err })
    }
    return new PayloadQueryError(err)
  }
}
