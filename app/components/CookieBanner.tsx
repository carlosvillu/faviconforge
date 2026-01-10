import { useTranslation } from 'react-i18next'

import { BrutalistButton } from '~/components/BrutalistButton'

type CookieBannerProps = {
  isOpen: boolean
  onAccept: () => void
  onReject: () => void
}

export function CookieBanner({ isOpen, onAccept, onReject }: CookieBannerProps) {
  const { t } = useTranslation()

  if (!isOpen) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] border-t-8 border-black bg-yellow-300">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="text-xl font-black uppercase">{t('cookie_banner_title')}</div>
            <p className="font-bold text-lg text-black mt-2">{t('cookie_banner_description')}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <BrutalistButton type="button" onClick={onAccept}>
              {t('cookie_banner_accept')}
            </BrutalistButton>
            <BrutalistButton
              type="button"
              onClick={onReject}
              className="bg-white text-black border-4 border-black hover:bg-black hover:text-white"
            >
              {t('cookie_banner_reject')}
            </BrutalistButton>
          </div>
        </div>
      </div>
    </div>
  )
}
