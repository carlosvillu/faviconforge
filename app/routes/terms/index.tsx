import type { LoaderFunctionArgs, MetaFunction } from 'react-router'
import { useLoaderData } from 'react-router'
import { marked } from 'marked'
import { detectLocale, parseLangCookie } from '~/lib/i18n'

// Static imports of markdown files (Vite handles ?raw)
import termsEn from './terms.en.md?raw'
import termsEs from './terms.es.md?raw'

const markdownContent = {
  en: termsEn,
  es: termsEs,
} as const

export const meta: MetaFunction = () => {
  return [
    { title: 'Terms of Service - FaviconForge' },
    { name: 'description', content: 'Terms of Service for FaviconForge favicon generator' },
  ]
}

export async function loader({ request }: LoaderFunctionArgs) {
  // Detect locale from cookie or Accept-Language header
  const cookieHeader = request.headers.get('Cookie')
  const langCookie = parseLangCookie(cookieHeader)
  const locale = detectLocale(request, langCookie)

  // Get markdown content for locale
  const markdown = markdownContent[locale]

  // Convert to HTML
  const html = await marked.parse(markdown)

  return { content: html, locale }
}

export default function TermsPage() {
  const { content } = useLoaderData<typeof loader>()

  return (
    <main className="bg-yellow-300 min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-6">
        <div className="border-8 border-black bg-white p-8 md:p-12">
          <article
            className="prose-brutalist"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </div>
    </main>
  )
}
