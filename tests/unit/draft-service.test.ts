import { afterEach, describe, expect, it, mock, vi } from 'bun:test'

import { InvalidPreviewSlugError, PayloadQueryError, UnauthorizedError } from '@/lib/errors'

const auth = mock(
  async (_input: { headers: Headers }): Promise<{ user: { id: string } | null }> => ({
    user: { id: 'user-1' },
  }),
)

const getPayload = mock(async (_input: { config: unknown }) => ({
  auth,
}))

mock.module('payload', () => ({
  getPayload,
}))

mock.module('@payload-config', () => ({
  default: {},
}))

const { enableDraftModeForSlug } = await import('@/lib/service/draft-service')

describe('enableDraftModeForSlug', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('rejects an invalid preview slug before touching Payload', async () => {
    const result = await enableDraftModeForSlug({
      headers: new Headers(),
      slug: '/admin',
    })

    expect(getPayload).not.toHaveBeenCalled()
    expect(result.isErr()).toBe(true)

    if (result.isOk()) {
      throw new Error('Expected an error result')
    }

    expect(result.error).toBeInstanceOf(InvalidPreviewSlugError)
  })

  it('returns the validated slug when Payload auth succeeds', async () => {
    const headers = new Headers([['cookie', 'payload-token=abc']])

    const result = await enableDraftModeForSlug({
      headers,
      slug: '/question/123',
    })

    expect(getPayload).toHaveBeenCalledTimes(1)
    expect(auth).toHaveBeenCalledWith({ headers })
    expect(result.isOk()).toBe(true)

    if (result.isErr()) {
      throw result.error
    }

    expect(result.value).toEqual({ slug: '/question/123' })
  })

  it('returns an unauthorized error when Payload auth has no user', async () => {
    auth.mockImplementationOnce(async () => ({ user: null }))

    const result = await enableDraftModeForSlug({
      headers: new Headers(),
      slug: '/question/123',
    })

    expect(result.isErr()).toBe(true)

    if (result.isOk()) {
      throw new Error('Expected an error result')
    }

    expect(result.error).toBeInstanceOf(UnauthorizedError)
  })

  it('wraps Payload bootstrap failures', async () => {
    getPayload.mockImplementationOnce(async () => {
      throw new Error('boom')
    })

    const result = await enableDraftModeForSlug({
      headers: new Headers(),
      slug: '/question/123',
    })

    expect(result.isErr()).toBe(true)

    if (result.isOk()) {
      throw new Error('Expected an error result')
    }

    expect(result.error).toBeInstanceOf(PayloadQueryError)
  })
})
