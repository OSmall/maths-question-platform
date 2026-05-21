import { z } from 'zod'
import { Result } from 'neverthrow'

import { InvalidUUIDError } from '@/lib/errors'
import { parseToResult } from '@/lib/utils/validation'

export const uuidSchema = z.uuid().brand<'UUID'>()
export type UUID = z.infer<typeof uuidSchema>

export function parseUUID(value: unknown): UUID {
  return uuidSchema.parse(value)
}

export function parseUUIDToResult(value: unknown): Result<UUID, InvalidUUIDError> {
  return parseToResult(uuidSchema, value).mapErr((error) => new InvalidUUIDError(value, { cause: error }))
}

export function randomUUIDv7(): UUID {
  return parseUUID(Bun.randomUUIDv7())
}
