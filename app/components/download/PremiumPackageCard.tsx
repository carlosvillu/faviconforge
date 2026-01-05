import { useTranslation } from 'react-i18next'

type PremiumPackageCardProps = {
  isSelected: boolean
  onSelect: () => void
}

export function PremiumPackageCard({ isSelected, onSelect }: PremiumPackageCardProps) {
  const { t } = useTranslation()

  const items = [
    'download_premium_item_all_free',
    'download_premium_item_apple',
    'download_premium_item_android',
    'download_premium_item_maskable',
    'download_premium_item_windows',
    'download_premium_item_manifest',
    'download_premium_item_browserconfig',
    'download_premium_item_readme',
  ]

  return (
    <button
      type="button"
      onClick={onSelect}
      className={getCardClassName({ isSelected, variant: 'premium' })}
    >
      <div className="absolute top-0 right-0 bg-red-600 text-white px-4 py-1 font-black text-sm rotate-12 transform translate-x-4 -translate-y-2">
        {t('download_best_value')}
      </div>

      <div>
        <div className="text-3xl font-black uppercase mb-2">{t('download_premium_title')}</div>
        <div className="text-6xl font-black">€5</div>
        <div className="mt-2 font-black text-sm uppercase">{t('download_premium_lifetime')}</div>
      </div>

      <div className="border-t-4 border-yellow-300 pt-6 mt-6">
        <p className="font-black text-sm uppercase mb-4">{t('download_premium_includes')}</p>
        <ul className="space-y-3">
          {items.map((key) => (
            <li key={key} className="flex items-start gap-3 font-bold text-lg">
              <span className={isSelected ? 'text-2xl text-green-400' : 'text-2xl text-green-600'}>
                ✓
              </span>
              <span>{t(key)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t-4 border-yellow-300 pt-6 mt-6 flex items-center justify-between">
        <span className="font-black text-sm uppercase">{t('download_zip_size')}</span>
        <span className="font-black text-sm uppercase">{t('download_premium_size')}</span>
      </div>
    </button>
  )
}

function getCardClassName(params: { isSelected: boolean; variant: 'free' | 'premium' }) {
  const { isSelected, variant } = params

  if (variant === 'premium') {
    return [
      'relative border-8 border-black p-8 text-left transition-transform overflow-visible',
      isSelected
        ? 'bg-black text-yellow-300 scale-[1.02]'
        : 'bg-white hover:translate-x-1 hover:translate-y-1',
    ].join(' ')
  }

  return [
    'relative border-8 border-black p-8 text-left transition-transform overflow-visible',
    isSelected ? 'bg-yellow-300 scale-[1.02]' : 'bg-white hover:translate-x-1 hover:translate-y-1',
  ].join(' ')
}
