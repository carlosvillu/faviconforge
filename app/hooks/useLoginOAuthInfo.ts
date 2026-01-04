import { useMemo } from 'react'

export function useLoginOAuthInfo(
  searchParams: URLSearchParams,
  t: (key: string) => string
): { infoMessage: string | null; fallbackErrorMessage: string | null } {
  return useMemo(() => {
    const oauthError = searchParams.get('error')

    if (!oauthError) {
      return { infoMessage: null, fallbackErrorMessage: null }
    }

    if (oauthError === 'user_not_found' || oauthError === 'signup_disabled') {
      return { infoMessage: t('oauth_no_account'), fallbackErrorMessage: null }
    }

    return { infoMessage: null, fallbackErrorMessage: t('oauth_error') }
  }, [searchParams, t])
}
