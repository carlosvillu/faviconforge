import { useEffect } from 'react'
import type { LoaderFunctionArgs } from 'react-router'
import { useTranslation } from 'react-i18next'
import { getCurrentUser } from '~/lib/auth.server'
import { useHeaderStep } from '~/contexts/HeaderStepContext'
import { Footer } from '~/components/landing/Footer'
import {
  UploadProgressBar,
  UploadDropzone,
  ImageRequirements,
} from '~/components/upload'

export function meta() {
  return [{ title: 'Upload - FaviconForge' }]
}

export async function loader({ request }: LoaderFunctionArgs) {
  const authSession = await getCurrentUser(request)
  return {
    user: authSession?.user ?? null,
    session: authSession?.session ?? null,
  }
}

export default function UploadPage() {
  const { t } = useTranslation()
  const { setStep } = useHeaderStep()

  // Set step info for header
  useEffect(() => {
    setStep({ current: 1, total: 3, label: 'UPLOAD' })
    // Clear step on unmount
    return () => setStep(null)
  }, [setStep])

  return (
    <div className="min-h-screen bg-white font-mono">
      <UploadProgressBar progress={33} />
      <main className="max-w-4xl mx-auto px-6 py-20">
        <div className="mb-12">
          <h2 className="text-6xl font-black uppercase mb-4 leading-none">
            {t('upload_title_line1')}
            <br />
            <span className="bg-black text-white px-2">
              {t('upload_title_line2')}
            </span>
          </h2>
          <p className="text-xl font-bold border-l-8 border-black pl-4 mt-6">
            {t('upload_subtitle')}
          </p>
        </div>
        <UploadDropzone />
        <ImageRequirements />
      </main>
      <Footer />
    </div>
  )
}
