import { useTranslation } from 'react-i18next'

export function FeaturesSection() {
  const { t } = useTranslation()

  const features = [
    {
      titleKey: 'feature_speed_title',
      descKey: 'feature_speed_desc',
    },
    {
      titleKey: 'feature_formats_title',
      descKey: 'feature_formats_desc',
    },
    {
      titleKey: 'feature_price_title',
      descKey: 'feature_price_desc',
    },
    {
      titleKey: 'feature_privacy_title',
      descKey: 'feature_privacy_desc',
    },
    {
      titleKey: 'feature_production_title',
      descKey: 'feature_production_desc',
    },
    {
      titleKey: 'feature_noaccount_title',
      descKey: 'feature_noaccount_desc',
    },
  ]

  return (
    <section className="bg-black text-yellow-300 py-20">
      <div className="max-w-7xl mx-auto px-6">
        <h3 className="text-5xl font-black uppercase mb-12 border-b-8 border-yellow-300 pb-4">
          {t('landing_features_title')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.titleKey}
              className="border-4 border-yellow-300 p-6 hover:bg-yellow-300 hover:text-black transition-colors"
            >
              <h4 className="text-2xl font-black mb-3">{t(feature.titleKey)}</h4>
              <p className="font-bold">{t(feature.descKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
