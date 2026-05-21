const redirectBaseUrl = 'https://maths-question-platform.local'

export function getSafeRelativeRedirectPath(value: string | null | undefined): string | undefined {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return undefined
  }

  try {
    const url = new URL(value, redirectBaseUrl)

    if (url.origin !== redirectBaseUrl) {
      return undefined
    }

    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return undefined
  }
}

export function getAuthenticatedRedirectPath(requestedRedirect?: string | null): string {
  return getSafeRelativeRedirectPath(requestedRedirect) ?? '/'
}

export function buildLoginRedirectPath(requestedPath: string): string {
  const safePath = getSafeRelativeRedirectPath(requestedPath) ?? '/'
  return `/login?redirect=${encodeURIComponent(safePath)}`
}
