export const COOKIE_CONSENT_NAME = 'cookie_consent'
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60 // 1 year in seconds

export type ConsentState = 'accepted' | 'rejected' | 'unset'

function parseCookies(cookieString: string): Record<string, string> {
  return cookieString.split(';').reduce(
    (acc, cookie) => {
      const [key, value] = cookie.trim().split('=')
      if (key && value) {
        acc[key] = value
      }
      return acc
    },
    {} as Record<string, string>
  )
}

export function readConsentFromCookie(cookieHeaderOrDocumentCookie: string | null): ConsentState {
  if (!cookieHeaderOrDocumentCookie) return 'unset'

  const cookies = parseCookies(cookieHeaderOrDocumentCookie)
  const value = cookies[COOKIE_CONSENT_NAME]

  if (value === 'accepted' || value === 'rejected') {
    return value
  }

  return 'unset'
}

export function createConsentCookie(value: Exclude<ConsentState, 'unset'>): string {
  return `${COOKIE_CONSENT_NAME}=${value}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`
}
