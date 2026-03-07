import { err, ok, Result, ResultAsync } from 'neverthrow'
import { getPayload } from 'payload'
import { z } from 'zod'
import config from '@payload-config'
import { InvalidPreviewSlugError, PayloadQueryError, UnauthorizedError } from '@/lib/errors'

type EnableDraftModeForSlugInput = {
  headers: Headers
  slug: string | null
}

const previewSlugSchema = z.string().startsWith('/question/')

export function enableDraftModeForSlug({
  headers,
  slug,
}: EnableDraftModeForSlugInput) {
  return validatePreviewSlug(slug)
    .asyncAndThen((validatedSlug) =>
      authenticatePayloadUser(headers).map(() => ({ slug: validatedSlug })),
    )
}

function validatePreviewSlug(slug: string | null): Result<string, InvalidPreviewSlugError> {
  const result = previewSlugSchema.safeParse(slug)
  if (!result.success) {
    return err(new InvalidPreviewSlugError(slug))
  }
  return ok(result.data)
}

function authenticatePayloadUser(
  headers: Headers,
): ResultAsync<void, UnauthorizedError | PayloadQueryError> {
  return ResultAsync.fromPromise(getPayload({ config }), (error) => new PayloadQueryError(error))
    .andThen((payload) =>
      ResultAsync.fromPromise(payload.auth({ headers }), (error) => new PayloadQueryError(error)),
    )
    .andThen(({ user }) => (user ? ok() : err(new UnauthorizedError())))
}
