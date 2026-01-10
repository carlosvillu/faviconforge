import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import { initAnalytics, trackEvent } from '~/lib/analytics'

describe('analytics', () => {
  beforeEach(() => {
    // reset between tests
    window.__ffGAInitialized = false
    window.__ffLoadGA = undefined
    window.gtag = undefined
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('trackEvent is a no-op when window is not available (SSR)', () => {
    const originalWindow = globalThis.window
    const originalDocument = globalThis.document

    vi.stubGlobal('window', undefined as unknown as Window)
    vi.stubGlobal('document', undefined as unknown as Document)

    expect(() => trackEvent('test_event')).not.toThrow()

    vi.stubGlobal('window', originalWindow)
    vi.stubGlobal('document', originalDocument)
  })

  it('initAnalytics does nothing without measurementId', () => {
    const appendSpy = vi.spyOn(document.head, 'appendChild')

    initAnalytics({ measurementId: null, hasConsent: true })

    expect(window.__ffGAInitialized).toBeFalsy()
    expect(appendSpy).not.toHaveBeenCalled()
  })

  it('initAnalytics does nothing without consent', () => {
    const appendSpy = vi.spyOn(document.head, 'appendChild')

    initAnalytics({ measurementId: 'G-TEST123', hasConsent: false })

    expect(window.__ffGAInitialized).toBeFalsy()
    expect(appendSpy).not.toHaveBeenCalled()
  })

  it("when initialized, trackEvent calls gtag('event', ...)", () => {
    window.__ffGAInitialized = true
    window.gtag = vi.fn()

    trackEvent('x')

    expect(window.gtag).toHaveBeenCalledWith('event', 'x')
  })
})
