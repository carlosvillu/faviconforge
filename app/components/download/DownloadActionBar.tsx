import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { BrutalistButton } from '~/components/BrutalistButton'
import { trackFFEvent } from '~/lib/analytics'

type DownloadActionBarProps = {
  selectedTier: 'free' | 'premium'
  downloadState: 'idle' | 'generating' | 'ready' | 'error'
  onDownload: () => Promise<void>
  onBuyPremium?: () => void
  isPremium: boolean
  isLoggedIn: boolean
  isCheckoutLoading?: boolean
}

export function DownloadActionBar({
  selectedTier,
  downloadState,
  onDownload,
  onBuyPremium,
  isPremium,
  isLoggedIn,
  isCheckoutLoading = false,
}: DownloadActionBarProps) {
  const { t } = useTranslation()

  const isGenerating = downloadState === 'generating'

  const showLoginButton = selectedTier === 'premium' && !isLoggedIn
  const showBuyButton = selectedTier === 'premium' && isLoggedIn && !isPremium
  const showPremiumDownload = selectedTier === 'premium' && isPremium
  const showFreeDownload = selectedTier === 'free'

  const handleFreeDownloadClick = async () => {
    trackFFEvent('download_free_click', {
      tier: 'free',
    })
    await onDownload()
  }

  const description =
    selectedTier === 'free'
      ? t('download_ready_free_desc')
      : isLoggedIn && isPremium
        ? t('download_ready_premium_desc')
        : t('download_ready_login_desc')

  return (
    <div className="border-8 border-black p-8 bg-yellow-300">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
        <div>
          <h3 className="text-3xl font-black uppercase mb-2">{t('download_ready_title')}</h3>
          <p className="font-bold text-lg">{description}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          {showFreeDownload && (
            <BrutalistButton
              type="button"
              onClick={handleFreeDownloadClick}
              disabled={isGenerating}
              className="px-12 py-6 text-xl"
            >
              <div className="flex flex-col items-center">
                <span>{isGenerating ? t('download_generating') : t('download_free_cta')}</span>
                <span className="text-xs font-bold mt-1">{t('download_free_size')}</span>
              </div>
            </BrutalistButton>
          )}

          {showLoginButton && (
            <>
              <BrutalistButton asChild className="px-10 py-6 text-xl">
                <Link to="/auth/login?redirect=/download">{t('download_login_cta')}</Link>
              </BrutalistButton>
              <button
                type="button"
                disabled
                className="bg-black text-yellow-300 px-12 py-6 font-black uppercase text-xl border-4 border-black rounded-none opacity-70"
              >
                <div className="flex flex-col items-center">
                  <span>{t('download_buy_cta')}</span>
                  <span className="text-xs font-bold mt-1">{t('download_buy_subtitle')}</span>
                </div>
              </button>
            </>
          )}

          {showBuyButton && (
            <button
              type="button"
              onClick={onBuyPremium}
              disabled={isCheckoutLoading}
              className="bg-black text-yellow-300 px-12 py-6 font-black uppercase text-xl border-4 border-black rounded-none hover:bg-white hover:text-black transition-all hover:scale-105 disabled:opacity-70 disabled:hover:scale-100 disabled:hover:bg-black disabled:hover:text-yellow-300"
            >
              <div className="flex flex-col items-center">
                <span>{isCheckoutLoading ? t('checkout_redirecting') : t('download_buy_cta')}</span>
                {!isCheckoutLoading && (
                  <span className="text-xs font-bold mt-1">{t('download_buy_subtitle')}</span>
                )}
              </div>
            </button>
          )}

          {showPremiumDownload && (
            <button
              type="button"
              onClick={onDownload}
              disabled={isGenerating}
              className="bg-black text-yellow-300 px-12 py-6 font-black uppercase text-xl border-4 border-black rounded-none hover:bg-white hover:text-black transition-all hover:scale-105"
            >
              <div className="flex flex-col items-center">
                <span>{isGenerating ? t('download_generating') : t('download_premium_cta')}</span>
                <span className="text-xs font-bold mt-1">{t('download_premium_size')}</span>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
