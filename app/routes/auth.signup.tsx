import { Link, useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { GoogleAuthButton } from '~/components/GoogleAuthButton'
import { AuthCardShell } from '~/components/auth/AuthCardShell'
import { AuthCardHeader } from '~/components/auth/AuthCardHeader'

export default function SignupPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/'

  return (
    <AuthCardShell>
      <AuthCardHeader title={t('signup_title')} />

      <div className="px-8 space-y-6">
        <GoogleAuthButton mode="signup" callbackURL={redirectTo} />

        <p className="text-center font-bold text-sm text-black">
          {t('have_account_prompt')}{' '}
          <Link
            to="/auth/login"
            className="font-black uppercase underline decoration-4 underline-offset-4"
          >
            {t('login_link')}
          </Link>
        </p>
      </div>
    </AuthCardShell>
  )
}
