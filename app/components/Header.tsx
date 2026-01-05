import { Link, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { authClient } from '~/lib/auth.client'
import { LanguageSelector } from '~/components/LanguageSelector'
import { UserDropdown } from '~/components/UserDropdown'
import { BrutalistButton } from '~/components/BrutalistButton'
import { useHeaderStep } from '~/contexts/HeaderStepContext'
import type { Session, User } from '~/lib/auth'

type HeaderProps = {
  session: Session | null
  user: User | null
}

export function Header({ session, user }: HeaderProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { step } = useHeaderStep()

  const handleLogout = async () => {
    await authClient.signOut()
    navigate('/')
  }

  return (
    <header className={`border-b-8 border-black p-4 md:p-6 ${step ? 'bg-yellow-300' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
        {/* Top row: Logo + Auth/Language */}
        <div className="flex justify-between items-center">
          <Link to="/">
            <h1 className="text-xl md:text-3xl font-black uppercase tracking-tight">FaviconForge</h1>
          </Link>

          {/* Mobile: Auth + Language in top row */}
          <div className="flex gap-2 md:gap-4 items-center md:hidden">
            {session && user ? (
              <UserDropdown user={user} onLogout={handleLogout} />
            ) : (
              <BrutalistButton asChild className="px-4 py-2 text-sm">
                <Link to="/auth/login">{t('login')}</Link>
              </BrutalistButton>
            )}
            <LanguageSelector />
          </div>
        </div>

        {/* Step indicator - shown below logo on mobile */}
        {step && (
          <span className="font-bold text-xs md:text-sm text-center md:text-left order-last md:order-none">
            STEP {step.current}/{step.total}: {step.label}
          </span>
        )}

        {/* Desktop: Auth + Language */}
        <div className="hidden md:flex gap-4 items-center">
          {session && user ? (
            <UserDropdown user={user} onLogout={handleLogout} />
          ) : (
            <BrutalistButton asChild className="px-6 py-3">
              <Link to="/auth/login">{t('login')}</Link>
            </BrutalistButton>
          )}
          <LanguageSelector />
        </div>
      </div>
    </header>
  )
}
