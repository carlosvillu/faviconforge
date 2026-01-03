import { useTranslation } from 'react-i18next'
import { RequirementItem } from './RequirementItem'

export function ImageRequirements() {
  const { t } = useTranslation()

  const requirements = [
    'upload_req_square',
    'upload_req_min_size',
    'upload_req_max_file',
    'upload_req_format',
  ]

  return (
    <div className="mt-12 border-8 border-black p-8 bg-yellow-300">
      <h3 className="text-2xl font-black uppercase mb-6">
        {t('upload_requirements_title')}
      </h3>
      <ul className="space-y-3">
        {requirements.map((key) => (
          <RequirementItem key={key} text={t(key)} />
        ))}
      </ul>
    </div>
  )
}
