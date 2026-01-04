import { useTranslation } from 'react-i18next'

type FreePackageCardProps = {
  isSelected: boolean
  onSelect: () => void
}

export function FreePackageCard({ isSelected, onSelect }: FreePackageCardProps) {
  const { t } = useTranslation()

  const items = [
    'download_free_item_ico',
    'download_free_item_png16',
    'download_free_item_png32',
    'download_free_item_png48',
    'download_free_item_snippet',
  ]

  return (
    <button
      type="button"
      onClick={onSelect}
      className={getCardClassName({ isSelected, variant: 'free' })}
    >
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="text-3xl font-black uppercase mb-2">{t('download_free_title')}</div>
          <div className="text-6xl font-black">€0</div>
        </div>
        <div className="text-right">
          <div className="inline-block bg-green-600 text-white px-3 py-1 text-xs font-black uppercase border-2 border-black">
            FREE
          </div>
        </div>
      </div>

      <div className="border-t-4 border-black pt-6 mt-6">
        <p className="font-black text-sm uppercase mb-4">{t('download_included')}</p>
        <ul className="space-y-3">
          {items.map((key) => (
            <li key={key} className="flex items-start gap-3 font-bold text-lg">
              <span className="text-2xl text-green-600">✓</span>
              <span>{t(key)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t-4 border-black pt-6 mt-6 flex items-center justify-between">
        <span className="font-black text-sm uppercase">{t('download_zip_size')}</span>
        <span className="font-black text-sm uppercase">{t('download_free_size')}</span>
      </div>
    </button>
  )
}

function getCardClassName(params: { isSelected: boolean; variant: 'free' | 'premium' }) {
  const { isSelected, variant } = params

  if (variant === 'free') {
    return [
      'border-8 border-black p-8 text-left transition-transform',
      isSelected
        ? 'bg-yellow-300 scale-[1.02]'
        : 'bg-white hover:translate-x-1 hover:translate-y-1',
    ].join(' ')
  }

  return [
    'border-8 border-black p-8 text-left transition-transform',
    isSelected
      ? 'bg-black text-yellow-300 scale-[1.02]'
      : 'bg-white hover:translate-x-1 hover:translate-y-1',
  ].join(' ')
}
