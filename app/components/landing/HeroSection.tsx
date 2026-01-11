import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { FormatDemoCard } from './FormatDemoCard'

export function HeroSection() {
  const { t } = useTranslation()

  return (
    <section className="bg-yellow-300 py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Text Content */}
          <div className="space-y-8">
            <h2 className="text-6xl font-black uppercase leading-none">
              {t('landing_hero_line1')}
              <br />
              <span className="bg-black text-yellow-300 px-2">{t('landing_hero_line2')}</span>
              <br />
              {t('landing_hero_line3')}
              <br />
              {t('landing_hero_line4')}
            </h2>

            <p className="text-2xl font-bold border-l-8 border-black pl-4">
              {t('landing_hero_tagline')}
            </p>

            <Link to="/upload">
              <button className="bg-black text-yellow-300 px-8 py-4 font-black uppercase text-lg border-4 border-black hover:translate-x-1 hover:translate-y-1 transition-transform">
                {t('landing_hero_cta')} →
              </button>
            </Link>
          </div>

          {/* Right Column - Format Demo */}
          <div className="relative">
            <FormatDemoCard />
          </div>
        </div>
      </div>
    </section>
  )
}
