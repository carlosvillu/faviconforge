import { useCallback, useEffect, useState } from 'react'

import {
  type ConsentState,
  createConsentCookie,
  readConsentFromCookie,
} from '~/lib/cookieConsent'

export function useCookieConsent() {
  const [hasHydrated, setHasHydrated] = useState(false)
  const [consent, setConsent] = useState<ConsentState>(() => {
    if (typeof document === 'undefined') return 'unset'
    return readConsentFromCookie(document.cookie)
  })

  useEffect(() => {
    setHasHydrated(true)
  }, [])

  const accept = useCallback(() => {
    if (typeof document === 'undefined') return
    document.cookie = createConsentCookie('accepted')
    setConsent('accepted')
  }, [])

  const reject = useCallback(() => {
    if (typeof document === 'undefined') return
    document.cookie = createConsentCookie('rejected')
    setConsent('rejected')
  }, [])

  const shouldShowBanner = hasHydrated && consent === 'unset'

  return {
    consent,
    accept,
    reject,
    hasHydrated,
    shouldShowBanner,
  }
}
