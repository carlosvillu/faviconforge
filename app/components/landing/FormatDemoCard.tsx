import { useTranslation } from 'react-i18next'

export function FormatDemoCard() {
  const { t } = useTranslation()

  const formats = [
    {
      name: t('landing_format_ico'),
      sizes: t('landing_format_ico_sizes'),
      isFree: true,
    },
    {
      name: t('landing_format_apple'),
      sizes: t('landing_format_apple_sizes'),
      isFree: false,
    },
    {
      name: t('landing_format_manifest'),
      sizes: t('landing_format_manifest_sizes'),
      isFree: false,
    },
  ]

  return (
    <div className="border-8 border-black p-6 bg-white rotate-1 relative">
      <div className="space-y-4">
        {formats.map((format) => (
          <div
            key={format.name}
            className="flex items-center gap-4 border-b-4 border-black pb-4 last:border-b-0"
          >
            <div className="w-12 h-12 bg-black flex-shrink-0"></div>
            <div className="flex-1">
              <div className="font-black text-lg">{format.name}</div>
              <div className="text-xs font-bold text-gray-600">
                {format.sizes}
              </div>
            </div>
            <div>
              {format.isFree ? (
                <span className="bg-green-600 text-white px-3 py-1 font-black text-xs uppercase border-2 border-black">
                  {t('landing_format_free')}
                </span>
              ) : (
                <span className="bg-red-600 text-white px-3 py-1 font-black text-xs uppercase border-2 border-black">
                  €5
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
