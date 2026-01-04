import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'

export function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="bg-black text-yellow-300 border-t-8 border-yellow-300 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Column 1 - Brand */}
          <div>
            <h4 className="text-2xl font-black uppercase mb-3">FaviconForge</h4>
            <p className="font-bold">{t('landing_footer_tagline')}</p>
          </div>

          {/* Column 2 - Links */}
          <div>
            <h4 className="text-xl font-black uppercase mb-3">
              {t('landing_footer_links')}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/terms"
                  className="font-bold hover:text-white transition-colors"
                >
                  {t('landing_footer_terms')}
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="font-bold hover:text-white transition-colors"
                >
                  {t('landing_footer_privacy')}
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="font-bold hover:text-white transition-colors"
                >
                  {t('landing_footer_contact')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3 - Support */}
          <div>
            <h4 className="text-xl font-black uppercase mb-3">
              {t('landing_footer_support')}
            </h4>
            <p className="font-bold">support@faviconforge.com</p>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t-4 border-yellow-300 pt-8 text-center">
          <p className="font-black text-sm">{t('landing_footer_copyright')}</p>
        </div>
      </div>
    </footer>
  )
}
