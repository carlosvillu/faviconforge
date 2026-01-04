import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'

export function BackToPreviewButton() {
  const { t } = useTranslation()

  return (
    <div className="mt-12 flex justify-center">
      <Link
        to="/preview"
        className="bg-white text-black px-8 py-4 font-black uppercase text-lg border-4 border-black hover:bg-yellow-300 transition-colors"
      >
        {t('download_back_preview')}
      </Link>
    </div>
  )
}
