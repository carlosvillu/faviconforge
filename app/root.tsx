import { useEffect } from 'react'
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  data,
} from 'react-router'
import { useLocation } from 'react-router'
import { I18nextProvider } from 'react-i18next'
import { type i18n } from 'i18next'

import type { Route } from './+types/root'
import './app.css'
import { Header } from '~/components/Header'
import { Footer } from '~/components/Footer'
import {
  detectLocale,
  parseLangCookie,
  createLangCookie,
  createI18nInstance,
  type Locale,
  DEFAULT_LOCALE,
} from '~/lib/i18n'
import { initI18nClientSync, getI18nInstance } from '~/lib/i18n.client'
import { auth } from '~/lib/auth'
import { Toaster } from '~/components/ui/sonner'
import { ThemeProvider } from '~/components/ThemeContext'
import { HeaderStepProvider } from '~/contexts/HeaderStepContext'
import { getThemeCookie, getThemeInitScript } from '~/lib/theme'
import { CookieBanner } from '~/components/CookieBanner'
import { useCookieConsent } from '~/hooks/useCookieConsent'
import { useAnalytics } from '~/hooks/useAnalytics'
import { getAnalyticsInitScript, trackPageView } from '~/lib/analytics'
import { useLoginCompleteTracking } from '~/hooks/useLoginCompleteTracking'

export const links: Route.LinksFunction = () => [
  { rel: 'icon', type: 'image/svg+xml', href: '/favicon-b.svg' },
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap',
  },
]

// Server-side i18n instance cache (per-request in production)
let serverI18nInstance: i18n | null = null

export async function loader({ request }: Route.LoaderArgs) {
  const cookieHeader = request.headers.get('Cookie')
  const langCookie = parseLangCookie(cookieHeader)
  const locale = detectLocale(request, langCookie)
  const themePreference = getThemeCookie(cookieHeader)
  const gaMeasurementId = process.env.GA_MEASUREMENT_ID ?? null

  // Get session from server
  const sessionData = await auth.api.getSession({
    headers: request.headers,
  })

  // Create i18n instance for SSR
  serverI18nInstance = await createI18nInstance(locale)

  const response = {
    locale,
    session: sessionData?.session ?? null,
    user: sessionData?.user ?? null,
    themePreference,
    gaMeasurementId,
  }

  // Set cookie if it doesn't exist or differs from detected locale
  if (!langCookie || langCookie !== locale) {
    return data(response, { headers: { 'Set-Cookie': createLangCookie(locale) } })
  }

  return response
}

export function getServerI18nInstance(): i18n | null {
  return serverI18nInstance
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        {/* Theme init script must run synchronously before body renders to prevent FOUC */}
        <script
          dangerouslySetInnerHTML={{
            __html: getThemeInitScript(),
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: getAnalyticsInitScript(),
          }}
        />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

// Client-side i18n instance (initialized once on first render)
let clientI18nInstance: i18n | null = null

function getI18nInstanceForRender(locale: Locale): i18n | null {
  if (typeof window === 'undefined') {
    // Server: use the instance created in the loader
    return serverI18nInstance
  }
  // Client: initialize once and reuse
  if (!clientI18nInstance) {
    initI18nClientSync(locale)
    clientI18nInstance = getI18nInstance()
  } else if (clientI18nInstance.language !== locale) {
    // Sync language if it differs (e.g., after navigation with different locale)
    clientI18nInstance.changeLanguage(locale)
  }
  return clientI18nInstance
}

export default function App({ loaderData }: Route.ComponentProps) {
  const locale = (loaderData?.locale ?? DEFAULT_LOCALE) as Locale
  const themePreference = loaderData?.themePreference ?? null
  const gaMeasurementId = loaderData?.gaMeasurementId ?? null
  const i18nInstance = getI18nInstanceForRender(locale)
  const location = useLocation()

  const { consent, accept, reject, shouldShowBanner } = useCookieConsent()
  useAnalytics({ measurementId: gaMeasurementId, consent })
  useLoginCompleteTracking({ session: loaderData?.session ?? null })

  // Update html lang attribute when locale changes
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  // Handle language changes after initial render
  useEffect(() => {
    if (typeof window !== 'undefined' && i18nInstance) {
      i18nInstance.changeLanguage(locale)
    }
  }, [locale, i18nInstance])

  useEffect(() => {
    if (!gaMeasurementId) return
    if (consent !== 'accepted') return

    const path = `${location.pathname}${location.search}`
    trackPageView(path, typeof document !== 'undefined' ? document.title : undefined)
  }, [gaMeasurementId, consent, location.pathname, location.search])

  if (!i18nInstance) {
    // Fallback during SSR if loader hasn't run yet (shouldn't happen normally)
    return (
      <ThemeProvider initialPreference={themePreference}>
        <HeaderStepProvider>
          <Header session={loaderData?.session ?? null} user={loaderData?.user ?? null} />
          <Outlet />
          <Footer />
        </HeaderStepProvider>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider initialPreference={themePreference}>
      <I18nextProvider i18n={i18nInstance}>
        <HeaderStepProvider>
          <Header session={loaderData.session} user={loaderData.user} />
          <Outlet />
          <Footer />
          <Toaster />
          {gaMeasurementId ? (
            <CookieBanner isOpen={shouldShowBanner} onAccept={accept} onReject={reject} />
          ) : null}
        </HeaderStepProvider>
      </I18nextProvider>
    </ThemeProvider>
  )
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!'
  let details = 'An unexpected error occurred.'
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error'
    details =
      error.status === 404 ? 'The requested page could not be found.' : error.statusText || details
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message
    stack = error.stack
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  )
}
