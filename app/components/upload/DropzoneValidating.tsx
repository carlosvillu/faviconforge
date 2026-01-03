import { useTranslation } from 'react-i18next'

export function DropzoneValidating() {
  const { t } = useTranslation()

  return (
    <div className="text-center space-y-8">
      <div className="w-32 h-32 mx-auto border-8 border-black bg-yellow-300 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="text-3xl font-black uppercase">{t('upload_validating')}</p>
    </div>
  )
}
