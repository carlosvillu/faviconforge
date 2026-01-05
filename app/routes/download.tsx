import { useEffect } from 'react'
import type { LoaderFunctionArgs } from 'react-router'
import { useLoaderData, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { getCurrentUser } from '~/lib/auth.server'
import type { User } from '~/lib/auth'
import { getPremiumStatus } from '~/services/premium.server'
import { useHeaderStep } from '~/contexts/HeaderStepContext'
import { UploadProgressBar } from '~/components/upload'
import { useDownload } from '~/hooks/useDownload'
import { DownloadSection } from '~/components/download/DownloadSection'
import { FreePackageCard } from '~/components/download/FreePackageCard'
import { PremiumPackageCard } from '~/components/download/PremiumPackageCard'
import { DownloadActionBar } from '~/components/download/DownloadActionBar'
import { PackageContentsPreview } from '~/components/download/PackageContentsPreview'
import { WarningBanner } from '~/components/download/WarningBanner'
import { BackToPreviewButton } from '~/components/download/BackToPreviewButton'

type LoaderData = {
  user: User | null
  isPremium: boolean
}

export function meta() {
  return [{ title: 'Download - FaviconForge' }]
}

export async function loader({ request }: LoaderFunctionArgs) {
  const authSession = await getCurrentUser(request)

  if (!authSession?.user) {
    return {
      user: null,
      isPremium: false,
    } satisfies LoaderData
  }

  const status = await getPremiumStatus(authSession.user.id)

  return {
    user: authSession.user,
    isPremium: status.isPremium,
  } satisfies LoaderData
}

export default function DownloadPage() {
  const { t } = useTranslation()
  const { setStep } = useHeaderStep()
  const navigate = useNavigate()
  const { user, isPremium } = useLoaderData() as LoaderData

  const download = useDownload({
    isPremium,
    isLoggedIn: !!user,
  })

  useEffect(() => {
    setStep({ current: 3, total: 3, label: t('download_step_label') })
    return () => setStep(null)
  }, [setStep, t])

  useEffect(() => {
    if (!download.hasSourceImage) {
      navigate('/upload')
    }
  }, [download.hasSourceImage, navigate])

  if (!download.hasSourceImage) {
    return null
  }

  return (
    <div className="min-h-screen bg-white font-mono">
      <UploadProgressBar progress={100} />
      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="mb-12">
          <h2 className="text-6xl font-black uppercase mb-4 leading-none">
            {t('download_title_line1')}
            <br />
            <span className="bg-black text-white px-2">{t('download_title_line2')}</span>
          </h2>
          <p className="text-xl font-bold border-l-8 border-black pl-4 mt-6">
            {t('download_subtitle')}
          </p>
        </div>

        <DownloadSection>
          <FreePackageCard
            isSelected={download.selectedTier === 'free'}
            onSelect={() => download.setSelectedTier('free')}
          />
          <PremiumPackageCard
            isSelected={download.selectedTier === 'premium'}
            onSelect={() => download.setSelectedTier('premium')}
          />
        </DownloadSection>

        <DownloadActionBar
          selectedTier={download.selectedTier}
          downloadState={download.downloadState}
          onDownload={download.triggerDownload}
          isPremium={isPremium}
          isLoggedIn={!!user}
        />

        {download.warnings.length > 0 && <WarningBanner warnings={download.warnings} />}

        <PackageContentsPreview />

        <BackToPreviewButton />
      </main>
    </div>
  )
}
