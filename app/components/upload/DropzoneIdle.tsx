import { useTranslation } from 'react-i18next'
import { UploadIcon } from './UploadIcon'

type DropzoneIdleProps = {
  isDragActive?: boolean
}

export function DropzoneIdle({ isDragActive = false }: DropzoneIdleProps) {
  const { t } = useTranslation()

  return (
    <div className="text-center space-y-8">
      <UploadIcon />
      <div>
        <p className="text-3xl font-black uppercase mb-4">
          {isDragActive ? t('upload_drop_here') : t('upload_drag_drop')}
        </p>
        <p className="text-xl font-bold mb-6">{t('upload_or_click')}</p>
        <label className="cursor-pointer">
          <span className="inline-block bg-black text-yellow-300 font-black uppercase border-4 border-black hover:bg-yellow-300 hover:text-black transition-colors px-8 py-4">
            {t('upload_browse_files')}
          </span>
        </label>
      </div>
      <div className="border-t-4 border-black pt-8">
        <p className="font-bold text-sm uppercase">{t('upload_accepted_formats')}</p>
        <p className="font-black text-2xl mt-2">{t('upload_formats_list')}</p>
      </div>
    </div>
  )
}
