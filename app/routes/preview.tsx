import { useEffect, useRef } from 'react'
import type { LoaderFunctionArgs } from 'react-router'
import { useLoaderData, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { getCurrentUser } from '~/lib/auth.server'
import type { User } from '~/lib/auth'
import { getPremiumStatus } from '~/services/premium.server'
import { useHeaderStep } from '~/contexts/HeaderStepContext'
import { useFaviconGeneration } from '~/hooks/useFaviconGeneration'
import { trackFFEvent } from '~/lib/analytics'
import { UploadProgressBar } from '~/components/upload'
import { PreviewGrid, PreviewActions, PreviewInfoBox } from '~/components/preview'

type LoaderData = {
  user: User | null
  session: unknown | null
  isPremium: boolean
}

export function meta() {
  return [{ title: 'Preview - FaviconForge' }]
}

export async function loader({ request }: LoaderFunctionArgs) {
  const authSession = await getCurrentUser(request)

  if (!authSession?.user) {
    return {
      user: null,
      session: authSession?.session ?? null,
      isPremium: false,
    } satisfies LoaderData
  }

  const status = await getPremiumStatus(authSession.user.id)
  return {
    user: authSession.user,
    session: authSession.session,
    isPremium: status.isPremium,
  } satisfies LoaderData
}

export default function PreviewPage() {
  const { t } = useTranslation()
  const { setStep } = useHeaderStep()
  const navigate = useNavigate()
  const { isPremium } = useLoaderData() as LoaderData
  const { generationState, getFaviconUrl, hasSourceImage } = useFaviconGeneration()
  const hasTrackedPreviewView = useRef(false)

  // Set step info for header
  useEffect(() => {
    setStep({ current: 2, total: 3, label: 'PREVIEW' })
    return () => setStep(null)
  }, [setStep])

  // Redirect to upload if no source image
  useEffect(() => {
    if (!hasSourceImage) {
      navigate('/upload')
    }
  }, [hasSourceImage, navigate])

  useEffect(() => {
    if (!hasSourceImage) return
    if (hasTrackedPreviewView.current) return

    trackFFEvent('preview_view', {
      has_source_image: true,
    })
    hasTrackedPreviewView.current = true
  }, [hasSourceImage])

  const handleBack = () => {
    navigate('/upload')
  }

  const handleDownload = () => {
    navigate('/download')
  }

  if (!hasSourceImage) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-white font-mono">
      <UploadProgressBar progress={66} />
      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="mb-12">
          <h2 className="text-6xl font-black uppercase mb-4 leading-none">
            {t('preview_title_line1')}
            <br />
            <span className="bg-black text-white px-2">{t('preview_title_line2')}</span>
          </h2>
          <p className="text-xl font-bold border-l-8 border-black pl-4 mt-6">
            {t('preview_subtitle')}
          </p>
        </div>

        <PreviewGrid
          generationState={generationState}
          getFaviconUrl={getFaviconUrl}
          isUserPremium={isPremium}
        />

        <PreviewActions onBack={handleBack} onDownload={handleDownload} />

        <PreviewInfoBox />
      </main>
    </div>
  )
}
