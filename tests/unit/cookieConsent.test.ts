import { describe, expect, it } from 'vitest'

import { createConsentCookie, readConsentFromCookie } from '~/lib/cookieConsent'

describe('cookieConsent', () => {
  it('readConsentFromCookie returns unset when missing', () => {
    expect(readConsentFromCookie(null)).toBe('unset')
    expect(readConsentFromCookie('lang=en; theme=dark')).toBe('unset')
  })

  it('readConsentFromCookie returns accepted/rejected', () => {
    expect(readConsentFromCookie('cookie_consent=accepted')).toBe('accepted')
    expect(readConsentFromCookie('foo=bar; cookie_consent=rejected; lang=en')).toBe('rejected')
  })

  it('createConsentCookie contains Path=/ and SameSite=Lax', () => {
    const cookie = createConsentCookie('accepted')
    expect(cookie).toContain('cookie_consent=accepted')
    expect(cookie).toContain('Path=/')
    expect(cookie).toContain('SameSite=Lax')
  })
})
