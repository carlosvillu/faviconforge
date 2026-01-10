type GtagFunction = (command: string, ...args: unknown[]) => void

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: GtagFunction
    __ffLoadGA?: (measurementId: string) => void
    __ffGAInitialized?: boolean
  }
}

export type AnalyticsInit = {
  measurementId: string | null
  hasConsent: boolean
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

export function getAnalyticsInitScript(): string {
  // Defines a global function but does NOT load GA until called.
  return `
    (function() {
      try {
        window.__ffLoadGA = function(measurementId) {
          if (!measurementId) return;
          if (window.__ffGAInitialized) return;
          window.__ffGAInitialized = true;

          window.dataLayer = window.dataLayer || [];
          function gtag(){ window.dataLayer.push(arguments); }
          window.gtag = gtag;

          var script = document.createElement('script');
          script.async = true;
          script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(measurementId);
          document.head.appendChild(script);

          window.gtag('js', new Date());
          window.gtag('config', measurementId, { send_page_view: false });
        };
      } catch (e) {
        // swallow
      }
    })();
  `
}

export function initAnalytics({ measurementId, hasConsent }: AnalyticsInit): void {
  if (!isBrowser()) return
  if (!measurementId) return
  if (!hasConsent) return

  if (window.__ffGAInitialized) return

  if (typeof window.__ffLoadGA === 'function') {
    window.__ffLoadGA(measurementId)
    return
  }

  // Fallback (should be rare): load without the head-defined helper.
  window.__ffGAInitialized = true
  window.dataLayer = window.dataLayer || []

  const gtag: GtagFunction = (command, ...args) => {
    window.dataLayer?.push([command, ...args])
  }
  window.gtag = gtag

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`
  document.head.appendChild(script)

  window.gtag('js', new Date())
  window.gtag('config', measurementId, { send_page_view: false })
}

export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (!isBrowser()) return
  if (!window.__ffGAInitialized) return
  if (typeof window.gtag !== 'function') return

  if (params) {
    window.gtag('event', name, params)
  } else {
    window.gtag('event', name)
  }
}

export function trackPageView(path: string, title?: string): void {
  if (!isBrowser()) return
  if (!window.__ffGAInitialized) return
  if (typeof window.gtag !== 'function') return

  const payload: Record<string, unknown> = {
    page_path: path,
  }

  if (title) {
    payload.page_title = title
  }

  window.gtag('event', 'page_view', payload)
}
