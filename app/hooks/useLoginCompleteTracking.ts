import { useEffect, useRef } from 'react'

import { trackFFEvent } from '~/lib/analytics'

type UseLoginCompleteTrackingParams = {
  session: unknown | null
}

export function useLoginCompleteTracking({ session }: UseLoginCompleteTrackingParams): void {
  const hasTracked = useRef(false)

  useEffect(() => {
    if (!session) return
    if (hasTracked.current) return
    if (typeof window === 'undefined') return

    let provider: string | null = null

    try {
      provider = window.sessionStorage.getItem('ff_login_flow_provider')
    } catch {
      provider = null
    }

    if (!provider) return

    trackFFEvent('login_complete', {
      provider,
    })

    hasTracked.current = true

    try {
      window.sessionStorage.removeItem('ff_login_flow_provider')
    } catch {
      // ignore
    }
  }, [session])
}
