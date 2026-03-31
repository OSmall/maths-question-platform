import { err, ok, type Result } from 'neverthrow'
import { z, type ZodError, type ZodType } from 'zod'

export function parseToResult<TSchema extends ZodType>(
  schema: TSchema,
  input: unknown,
): Result<z.output<TSchema>, ZodError> {
  const result = schema.safeParse(input)

  return result.success ? ok(result.data) : err(result.error)
}
