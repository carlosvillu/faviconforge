import { Link, useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { GoogleAuthButton } from '~/components/GoogleAuthButton'
import { AuthCardShell } from '~/components/auth/AuthCardShell'
import { AuthCardHeader } from '~/components/auth/AuthCardHeader'
import { AuthInfoCallout } from '~/components/auth/AuthInfoCallout'
import { AuthErrorCallout } from '~/components/auth/AuthErrorCallout'
import { useLoginOAuthInfo } from '~/hooks/useLoginOAuthInfo'

export default function LoginPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const { infoMessage, fallbackErrorMessage } = useLoginOAuthInfo(searchParams, t)
  const redirectTo = searchParams.get('redirect') || '/'

  return (
    <AuthCardShell>
      <AuthCardHeader title={t('login_title')} />

      <div className="px-8 space-y-6">
        <GoogleAuthButton mode="login" callbackURL={redirectTo} />

        {infoMessage ? (
          <AuthInfoCallout
            message={infoMessage}
            actionHref="/auth/signup"
            actionLabel={t('signup_link')}
          />
        ) : null}

        {fallbackErrorMessage ? <AuthErrorCallout message={fallbackErrorMessage} /> : null}

        <p className="text-center font-bold text-sm text-black">
          {t('no_account_prompt')}{' '}
          <Link
            to="/auth/signup"
            className="font-black uppercase underline decoration-4 underline-offset-4"
          >
            {t('signup_link')}
          </Link>
        </p>
      </div>
    </AuthCardShell>
  )
}
