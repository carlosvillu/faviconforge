import { Link, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { authClient } from '~/lib/auth.client'
import { Button } from '~/components/ui/button'
import { LanguageSelector } from '~/components/LanguageSelector'
import { UserDropdown } from '~/components/UserDropdown'
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
    <header className={`border-b-8 border-black p-6 ${step ? 'bg-yellow-300' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link to="/">
          <h1 className="text-3xl font-black uppercase tracking-tight">
            FaviconForge
          </h1>
        </Link>

        {/* Auth Section */}
        <div className="flex gap-4 items-center">
          {step && (
            <span className="font-bold text-sm">
              STEP {step.current}/{step.total}: {step.label}
            </span>
          )}
          {session && user ? (
            <UserDropdown user={user} onLogout={handleLogout} />
          ) : (
            <Button
              asChild
              className="bg-black text-yellow-300 font-black uppercase border-4 border-black hover:bg-yellow-300 hover:text-black transition-colors px-6 py-3"
            >
              <Link to="/auth/login">{t('login')}</Link>
            </Button>
          )}
          <LanguageSelector />
        </div>
      </div>
    </header>
  )
}
