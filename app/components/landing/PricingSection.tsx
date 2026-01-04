import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'

export function PricingSection() {
  const { t } = useTranslation()

  const freeFeatures = [
    'pricing_free_ico',
    'pricing_free_png',
    'pricing_free_html',
    'pricing_free_noaccount',
  ]

  const premiumFeatures = [
    'pricing_premium_all',
    'pricing_premium_apple',
    'pricing_premium_android',
    'pricing_premium_maskable',
    'pricing_premium_manifest',
    'pricing_premium_windows',
    'pricing_premium_docs',
  ]

  return (
    <section className="bg-white py-20">
      <div className="max-w-5xl mx-auto px-6">
        <h3 className="text-5xl font-black uppercase mb-12 text-center">
          {t('landing_pricing_title')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Free Tier */}
          <div className="border-8 border-black p-8 bg-yellow-300">
            <div className="text-3xl font-black uppercase mb-4">
              {t('landing_pricing_free')}
            </div>
            <div className="text-6xl font-black mb-6">€0</div>
            <ul className="space-y-3 mb-8">
              {freeFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2 font-bold text-lg">
                  <span className="text-2xl text-green-600">✓</span>
                  <span>{t(feature)}</span>
                </li>
              ))}
            </ul>
            <Link to="/upload">
              <button className="w-full bg-white border-4 border-black py-4 font-black uppercase hover:bg-black hover:text-white transition-colors">
                {t('landing_pricing_cta_free')}
              </button>
            </Link>
          </div>

          {/* Premium Tier */}
          <div className="border-8 border-black p-8 bg-black text-yellow-300 relative overflow-visible">
            <div className="absolute top-0 right-0 bg-red-600 text-white px-4 py-1 font-black text-sm rotate-12 transform translate-x-4 -translate-y-2">
              {t('landing_pricing_popular')}
            </div>
            <div className="text-3xl font-black uppercase mb-4">
              {t('landing_pricing_premium')}
            </div>
            <div className="text-6xl font-black mb-2">€5</div>
            <div className="text-xs font-bold mb-6">
              {t('landing_pricing_lifetime')}
            </div>
            <ul className="space-y-3 mb-8">
              {premiumFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2 font-bold text-lg">
                  <span className="text-2xl">✓</span>
                  <span>{t(feature)}</span>
                </li>
              ))}
            </ul>
            <Link to="/upload">
              <button className="w-full bg-yellow-300 text-black border-4 border-yellow-300 py-4 font-black uppercase hover:bg-white hover:border-white transition-colors">
                {t('landing_pricing_cta_premium')}
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
