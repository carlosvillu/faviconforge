import { useEffect, useMemo } from 'react'

import { initAnalytics, trackEvent, type AnalyticsInit } from '~/lib/analytics'
import type { ConsentState } from '~/lib/cookieConsent'

type UseAnalyticsInput = {
  measurementId: string | null
  consent: ConsentState
}

export function useAnalytics({ measurementId, consent }: UseAnalyticsInput) {
  const initConfig: AnalyticsInit = useMemo(
    () => ({
      measurementId,
      hasConsent: consent === 'accepted',
    }),
    [measurementId, consent]
  )

  useEffect(() => {
    initAnalytics(initConfig)
  }, [initConfig])

  return {
    trackEvent,
  }
}
