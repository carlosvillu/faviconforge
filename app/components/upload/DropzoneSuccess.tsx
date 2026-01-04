import { useTranslation } from 'react-i18next'
import { Button } from '~/components/ui/button'
import { CheckIcon } from './CheckIcon'

type DropzoneSuccessProps = {
  fileName: string
  fileSize: string
  previewUrl: string
  onContinue: () => void
  onChooseDifferent: () => void
}

export function DropzoneSuccess({
  fileName,
  fileSize,
  previewUrl,
  onContinue,
  onChooseDifferent,
}: DropzoneSuccessProps) {
  const { t } = useTranslation()

  return (
    <div className="text-center space-y-8">
      <CheckIcon />

      {/* Image Preview */}
      <div className="flex justify-center">
        <img
          src={previewUrl}
          alt={fileName}
          className="max-w-xs max-h-64 border-8 border-black object-contain"
        />
      </div>

      <div>
        <p className="text-3xl font-black uppercase text-green-600 mb-2">
          {t('upload_success')}
        </p>
        <p className="text-xl font-bold">{fileName}</p>
        <p className="text-lg font-bold text-gray-600">{fileSize}</p>
      </div>
      <div className="flex gap-4 justify-center">
        <Button
          onClick={(e) => {
            e.stopPropagation()
            onChooseDifferent()
          }}
          className="bg-white text-black font-black uppercase border-4 border-black hover:bg-black hover:text-white transition-colors px-6 py-3"
        >
          {t('upload_choose_different')}
        </Button>
        <Button
          onClick={(e) => {
            e.stopPropagation()
            onContinue()
          }}
          className="bg-black text-yellow-300 font-black uppercase border-4 border-black hover:bg-yellow-300 hover:text-black transition-colors px-6 py-3"
        >
          {t('upload_continue')} →
        </Button>
      </div>
    </div>
  )
}
