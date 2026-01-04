import { useTranslation } from 'react-i18next'

export function PackageContentsPreview() {
  const { t } = useTranslation()

  return (
    <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="border-8 border-black p-6 bg-white">
        <h4 className="text-2xl font-black uppercase mb-4 border-b-4 border-black pb-2">
          {t('download_free_contents_title')}
        </h4>
        <pre className="font-bold text-sm leading-6">
          {`faviconforge.zip\n├── web/\n│   ├── favicon.ico\n│   ├── favicon-16x16.png\n│   ├── favicon-32x32.png\n│   └── favicon-48x48.png\n└── snippet.html`}
        </pre>
      </div>

      <div className="border-8 border-black p-6 bg-black text-yellow-300">
        <h4 className="text-2xl font-black uppercase mb-4 border-b-4 border-yellow-300 pb-2">
          {t('download_premium_contents_title')}
        </h4>
        <pre className="font-bold text-sm leading-6">
          {`faviconforge.zip\n├── web/\n│   ├── favicon.ico\n│   ├── favicon-16x16.png\n│   ├── favicon-32x32.png\n│   └── favicon-48x48.png\n├── ios/\n│   └── apple-touch-icon.png\n├── android/\n│   ├── icon-192.png\n│   ├── icon-512.png\n│   ├── maskable-icon-192.png\n│   └── maskable-icon-512.png\n├── windows/\n│   └── mstile-150x150.png\n├── manifest.json\n├── browserconfig.xml\n├── snippet.html\n└── README.md`}
        </pre>
      </div>
    </div>
  )
}
