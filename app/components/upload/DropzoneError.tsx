import { useTranslation } from 'react-i18next'
import { Button } from '~/components/ui/button'

type DropzoneErrorProps = {
  errorKey: string
  errorParams?: Record<string, string | number>
  onTryAgain: () => void
}

export function DropzoneError({
  errorKey,
  errorParams,
  onTryAgain,
}: DropzoneErrorProps) {
  const { t } = useTranslation()

  return (
    <div className="border-8 border-red-600 p-8 bg-red-100">
      <div className="flex items-start gap-4 mb-6">
        <div className="text-4xl">⚠</div>
        <div>
          <h3 className="text-2xl font-black uppercase text-red-600 mb-2">
            {t('upload_error_title')}
          </h3>
          <p className="font-bold text-lg">{t(errorKey, errorParams)}</p>
        </div>
      </div>
      <Button
        onClick={(e) => {
          e.stopPropagation()
          onTryAgain()
        }}
        className="bg-black text-yellow-300 font-black uppercase border-4 border-black hover:bg-yellow-300 hover:text-black transition-colors px-6 py-3"
      >
        {t('upload_try_again')}
      </Button>
    </div>
  )
}
