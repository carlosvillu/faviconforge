import { useTranslation } from 'react-i18next'
import type { ManifestOptions } from '~/services/faviconGeneration.types'
import { InputBrutalist } from '~/components/InputBrutalist'

type ManifestCustomizerProps = {
  options: ManifestOptions
  onChange: (key: keyof ManifestOptions, value: string) => void
}

export function ManifestCustomizer({
  options,
  onChange,
}: ManifestCustomizerProps) {
  const { t } = useTranslation()

  return (
    <div className="border-8 border-black bg-yellow-300 p-8 mt-8">
      <h3 className="text-2xl font-black uppercase mb-6 border-b-4 border-black pb-4">
        {t('manifest_customizer_title')}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* App Name */}
        <div>
          <label
            htmlFor="manifest-app-name"
            className="block font-black uppercase text-sm mb-2"
          >
            {t('manifest_app_name_label')}
          </label>
          <InputBrutalist
            id="manifest-app-name"
            type="text"
            value={options.name}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder={t('manifest_app_name_placeholder')}
          />
        </div>

        {/* Short Name */}
        <div>
          <label
            htmlFor="manifest-short-name"
            className="block font-black uppercase text-sm mb-2"
          >
            {t('manifest_short_name_label')}
          </label>
          <InputBrutalist
            id="manifest-short-name"
            type="text"
            value={options.shortName}
            onChange={(e) => onChange('shortName', e.target.value)}
            placeholder={t('manifest_short_name_placeholder')}
          />
          <p className="text-xs font-bold mt-1 text-gray-700">
            {t('manifest_short_name_hint')}
          </p>
        </div>

        {/* Theme Color */}
        <div>
          <label
            htmlFor="manifest-theme-color"
            className="block font-black uppercase text-sm mb-2"
          >
            {t('manifest_theme_color_label')}
          </label>
          <div className="flex items-center gap-3">
            <input
              id="manifest-theme-color"
              type="color"
              value={options.themeColor}
              onChange={(e) => onChange('themeColor', e.target.value)}
              className="border-4 border-black h-12 w-20 cursor-pointer"
            />
            <span className="font-bold text-sm">{options.themeColor}</span>
          </div>
        </div>

        {/* Background Color */}
        <div>
          <label
            htmlFor="manifest-background-color"
            className="block font-black uppercase text-sm mb-2"
          >
            {t('manifest_background_color_label')}
          </label>
          <div className="flex items-center gap-3">
            <input
              id="manifest-background-color"
              type="color"
              value={options.backgroundColor}
              onChange={(e) => onChange('backgroundColor', e.target.value)}
              className="border-4 border-black h-12 w-20 cursor-pointer"
            />
            <span className="font-bold text-sm">{options.backgroundColor}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
