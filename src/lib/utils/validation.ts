import { err, ok, type Result } from 'neverthrow'
import { type ZodError, type ZodType, z } from 'zod'

export function parseWithSchema<TSchema extends ZodType>(
  schema: TSchema,
  input: unknown,
): Result<z.output<TSchema>, ZodError> {
  const result = schema.safeParse(input)

  return result.success ? ok(result.data) : err(result.error)
}
