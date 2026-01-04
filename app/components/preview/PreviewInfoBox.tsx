import { useTranslation } from 'react-i18next'

export function PreviewInfoBox() {
  const { t } = useTranslation()

  return (
    <div className="mt-12 border-8 border-black p-8 bg-yellow-300">
      <div className="flex items-start gap-4">
        <div className="text-4xl">💡</div>
        <div>
          <h3 className="text-2xl font-black uppercase mb-2">
            {t('preview_info_title')}
          </h3>
          <p className="font-bold text-lg">
            {t('preview_info_description')}
          </p>
        </div>
      </div>
    </div>
  )
}
