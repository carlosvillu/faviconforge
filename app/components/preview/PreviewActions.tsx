import { useTranslation } from 'react-i18next'
import { trackFFEvent } from '~/lib/analytics'

type PreviewActionsProps = {
  onBack: () => void
  onDownload: () => void
}

export function PreviewActions({ onBack, onDownload }: PreviewActionsProps) {
  const { t } = useTranslation()

  const handleDownloadClick = () => {
    trackFFEvent('download_nav_click', {
      from: 'preview',
    })
    onDownload()
  }

  return (
    <div className="mt-16 flex gap-6 justify-center">
      <button
        onClick={onBack}
        className="bg-white text-black px-8 py-4 font-black uppercase text-lg border-4 border-black hover:bg-yellow-300 transition-colors"
      >
        {t('preview_back')}
      </button>
      <button
        onClick={handleDownloadClick}
        className="bg-black text-yellow-300 px-12 py-4 font-black uppercase text-lg border-4 border-black hover:bg-yellow-300 hover:text-black transition-colors"
      >
        {t('preview_download')}
      </button>
    </div>
  )
}
