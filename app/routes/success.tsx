import { useEffect, useRef } from 'react'
import type { LoaderFunctionArgs } from 'react-router'
import { useLoaderData, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { requireAuth } from '~/lib/auth.server'
import { SuccessView } from '~/components/success/SuccessView'
import { trackFFEvent } from '~/lib/analytics'

export async function loader({ request }: LoaderFunctionArgs) {
  const { user } = await requireAuth(request)
  return { user }
}

export default function SuccessPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user } = useLoaderData<typeof loader>()
  const hasTrackedCheckoutComplete = useRef(false)

  useEffect(() => {
    if (hasTrackedCheckoutComplete.current) return

    trackFFEvent('checkout_complete', {
      tier: 'premium',
      price_eur: 5,
    })
    hasTrackedCheckoutComplete.current = true
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/download?autoDownload=true')
    }, 3000)

    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="min-h-screen bg-white font-mono pt-20">
      <SuccessView
        title={t('success_title')}
        subtitle={t('success_subtitle')}
        redirectText={t('success_redirecting')}
        manualLinkText={t('success_manual_link')}
      />
    </div>
  )
}
