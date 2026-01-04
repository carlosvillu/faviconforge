import { useTranslation } from 'react-i18next'

type WarningBannerProps = {
  warnings: string[]
}

export function WarningBanner({ warnings }: WarningBannerProps) {
  const { t } = useTranslation()

  return (
    <div className="border-4 border-yellow-500 bg-yellow-100 p-4 mt-6">
      <p className="font-black uppercase mb-2">{t('download_warning_title')}</p>
      <ul className="space-y-1">
        {warnings.map((warning) => (
          <li key={warning} className="font-bold text-sm">
            {t(`download_warning_${warning}`)}
          </li>
        ))}
      </ul>
    </div>
  )
}
