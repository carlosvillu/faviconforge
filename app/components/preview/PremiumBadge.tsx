import { useTranslation } from 'react-i18next'

export function PremiumBadge() {
  const { t } = useTranslation()

  return (
    <span className="inline-block bg-red-600 text-white px-3 py-1 text-xs font-black uppercase mt-2">
      {t('preview_premium_badge')}
    </span>
  )
}
