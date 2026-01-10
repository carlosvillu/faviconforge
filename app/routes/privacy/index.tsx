import type { LoaderFunctionArgs, MetaFunction } from 'react-router'
import { useLoaderData } from 'react-router'
import { marked } from 'marked'
import { createI18nInstance, detectLocale, parseLangCookie } from '~/lib/i18n'

import privacyEn from './privacy.en.md?raw'
import privacyEs from './privacy.es.md?raw'

const markdownContent = {
  en: privacyEn,
  es: privacyEs,
} as const

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: data?.metaTitle ?? 'Privacy Policy - FaviconForge' },
    {
      name: 'description',
      content: data?.metaDescription ?? 'Privacy Policy for the FaviconForge favicon generator',
    },
  ]
}

export async function loader({ request }: LoaderFunctionArgs) {
  const cookieHeader = request.headers.get('Cookie')
  const langCookie = parseLangCookie(cookieHeader)
  const locale = detectLocale(request, langCookie)

  const markdown = markdownContent[locale]
  const html = await marked.parse(markdown)

  const i18n = await createI18nInstance(locale)
  const metaTitle = i18n.t('privacy_meta_title')
  const metaDescription = i18n.t('privacy_meta_description')

  return { content: html, locale, metaTitle, metaDescription }
}

export default function PrivacyPage() {
  const { content } = useLoaderData<typeof loader>()

  return (
    <main className="bg-yellow-300 min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-6">
        <div className="border-8 border-black bg-white p-8 md:p-12">
          <article className="prose-brutalist" dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      </div>
    </main>
  )
}
