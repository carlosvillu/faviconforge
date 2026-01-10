import { useTranslation } from 'react-i18next'
import { ContactForm } from '~/components/forms/ContactForm'

export function meta() {
  return [
    { title: 'Contact Us - FaviconForge' },
    {
      name: 'description',
      content:
        'Have a question or feedback about FaviconForge? Contact us and we will get back to you soon.',
    },
  ]
}

export default function ContactPage() {
  const { t } = useTranslation()

  return (
    <main className="min-h-screen bg-yellow-300">
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-black uppercase tracking-tight">
            {t('contact_title')}
          </h1>
          <p className="mt-4 text-slate">{t('contact_description')}</p>
        </header>

        <div className="bg-paper border-4 border-ink p-8">
          <ContactForm />
        </div>
      </div>
    </main>
  )
}
