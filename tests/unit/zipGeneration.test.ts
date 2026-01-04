import { beforeEach, describe, expect, it, vi } from 'vitest'
import JSZip from 'jszip'
import {
  generateFreeZip,
  generatePremiumZip,
} from '../../app/services/zipGeneration'
import type { FaviconFormat } from '../../app/services/faviconGeneration.types'
import type { ManifestOptions } from '../../app/services/faviconGeneration.types'

// Helper to create mock FaviconFormat
function createMockFormat(
  name: string,
  tier: 'free' | 'premium',
): FaviconFormat {
  return {
    name,
    blob: new Blob([`mock-${name}`], { type: 'image/png' }),
    path: `test/${name}`,
    size: parseInt(name.match(/\d+/)?.[0] || '16'),
    tier,
  }
}

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => {
  vi.clearAllMocks()
})

describe('generateFreeZip', () => {
  const mockFormats: FaviconFormat[] = [
    createMockFormat('favicon-16x16.png', 'free'),
    createMockFormat('favicon-32x32.png', 'free'),
    createMockFormat('favicon-48x48.png', 'free'),
  ]

  const mockSourceImage = 'data:image/png;base64,mockdata'

  it('generates ZIP with ICO and free formats', async () => {
    // Mock successful ICO fetch
    const mockIcoBlob = new Blob(['mock-ico'], { type: 'image/x-icon' })
    mockFetch
      .mockResolvedValueOnce({
        blob: () => Promise.resolve(new Blob(['source-image'])),
      })
      .mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockIcoBlob),
      })

    const result = await generateFreeZip({
      formats: mockFormats,
      sourceImage: mockSourceImage,
    })

    // Verify result structure
    expect(result.blob).toBeInstanceOf(Blob)
    expect(result.warnings).toEqual([])
    expect(result.filename).toMatch(/^faviconforge-\d+\.zip$/)

    // Extract and verify ZIP contents
    const zip = await JSZip.loadAsync(result.blob)
    // Filter out directory entries (they have .dir = true)
    const files = Object.keys(zip.files).filter((name) => !zip.files[name].dir)

    expect(files).toContain('web/favicon.ico')
    expect(files).toContain('web/favicon-16x16.png')
    expect(files).toContain('web/favicon-32x32.png')
    expect(files).toContain('web/favicon-48x48.png')
    expect(files).toContain('snippet.html')
    expect(files).not.toContain('README.md')
    expect(files).not.toContain('manifest.json')
  })

  it('filters out premium formats', async () => {
    const mixedFormats = [
      ...mockFormats,
      createMockFormat('apple-touch-icon.png', 'premium'),
    ]

    mockFetch
      .mockResolvedValueOnce({
        blob: () => Promise.resolve(new Blob(['source-image'])),
      })
      .mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob(['mock-ico'])),
      })

    const result = await generateFreeZip({
      formats: mixedFormats,
      sourceImage: mockSourceImage,
    })

    const zip = await JSZip.loadAsync(result.blob)
    // Filter out directory entries (they have .dir = true)
    const files = Object.keys(zip.files).filter((name) => !zip.files[name].dir)

    expect(files).not.toContain('ios/apple-touch-icon.png')
    expect(files).toContain('web/favicon-16x16.png')
  })

  it('generates partial ZIP with warning when ICO fails', async () => {
    mockFetch
      .mockResolvedValueOnce({
        blob: () => Promise.resolve(new Blob(['source-image'])),
      })
      .mockResolvedValueOnce({
        ok: false,
      })

    const result = await generateFreeZip({
      formats: mockFormats,
      sourceImage: mockSourceImage,
    })

    expect(result.warnings).toContain('ico_generation_failed')
    expect(result.blob).toBeInstanceOf(Blob)

    const zip = await JSZip.loadAsync(result.blob)
    // Filter out directory entries (they have .dir = true)
    const files = Object.keys(zip.files).filter((name) => !zip.files[name].dir)

    expect(files).not.toContain('web/favicon.ico')
    expect(files).toContain('web/favicon-16x16.png')
  })

  it('snippet.html contains free tier instructions only', async () => {
    mockFetch
      .mockResolvedValueOnce({
        blob: () => Promise.resolve(new Blob(['source-image'])),
      })
      .mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob(['mock-ico'])),
      })

    const result = await generateFreeZip({
      formats: mockFormats,
      sourceImage: mockSourceImage,
    })

    const zip = await JSZip.loadAsync(result.blob)
    const snippetContent = await zip.file('snippet.html')?.async('text')

    expect(snippetContent).toContain('favicon.ico')
    expect(snippetContent).toContain('favicon-16x16.png')
    expect(snippetContent).not.toContain('apple-touch-icon')
    expect(snippetContent).not.toContain('manifest.json')
  })

  it('filename includes timestamp', async () => {
    mockFetch
      .mockResolvedValueOnce({
        blob: () => Promise.resolve(new Blob(['source-image'])),
      })
      .mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob(['mock-ico'])),
      })

    const result = await generateFreeZip({
      formats: mockFormats,
      sourceImage: mockSourceImage,
    })

    expect(result.filename).toMatch(/^faviconforge-\d+\.zip$/)
  })

  it('handles empty formats array gracefully', async () => {
    mockFetch
      .mockResolvedValueOnce({
        blob: () => Promise.resolve(new Blob(['source-image'])),
      })
      .mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob(['mock-ico'])),
      })

    const result = await generateFreeZip({
      formats: [],
      sourceImage: mockSourceImage,
    })

    expect(result.blob).toBeInstanceOf(Blob)

    const zip = await JSZip.loadAsync(result.blob)
    // Filter out directory entries (they have .dir = true)
    const files = Object.keys(zip.files).filter((name) => !zip.files[name].dir)

    expect(files).toContain('snippet.html')
  })

  it('handles network error for ICO gracefully', async () => {
    mockFetch
      .mockResolvedValueOnce({
        blob: () => Promise.resolve(new Blob(['source-image'])),
      })
      .mockRejectedValueOnce(new Error('Network error'))

    const result = await generateFreeZip({
      formats: mockFormats,
      sourceImage: mockSourceImage,
    })

    expect(result.warnings).toContain('ico_generation_failed')
    expect(result.blob).toBeInstanceOf(Blob)
  })
})

describe('generatePremiumZip', () => {
  const mockFormats: FaviconFormat[] = [
    createMockFormat('favicon-16x16.png', 'free'),
    createMockFormat('favicon-32x32.png', 'free'),
    createMockFormat('favicon-48x48.png', 'free'),
    createMockFormat('apple-touch-icon.png', 'premium'),
    createMockFormat('icon-192.png', 'premium'),
    createMockFormat('icon-512.png', 'premium'),
    createMockFormat('maskable-icon-192.png', 'premium'),
    createMockFormat('maskable-icon-512.png', 'premium'),
    createMockFormat('mstile-150x150.png', 'premium'),
  ]

  const mockManifestOptions: ManifestOptions = {
    name: 'Test App',
    shortName: 'Test',
    themeColor: '#000000',
    backgroundColor: '#ffffff',
  }

  const mockManifest = JSON.stringify({
    name: 'Test App',
    short_name: 'Test',
    theme_color: '#000000',
    background_color: '#ffffff',
  })

  const mockBrowserConfig = `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square150x150logo src="/windows/mstile-150x150.png"/>
      <TileColor>#ffffff</TileColor>
    </tile>
  </msapplication>
</browserconfig>`

  const mockSourceImage = 'data:image/png;base64,mockdata'

  it('generates ZIP with all formats in correct folders', async () => {
    mockFetch
      .mockResolvedValueOnce({
        blob: () => Promise.resolve(new Blob(['source-image'])),
      })
      .mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob(['mock-ico'])),
      })

    const result = await generatePremiumZip({
      formats: mockFormats,
      sourceImage: mockSourceImage,
      manifestOptions: mockManifestOptions,
      manifest: mockManifest,
      browserConfig: mockBrowserConfig,
    })

    const zip = await JSZip.loadAsync(result.blob)
    // Filter out directory entries (they have .dir = true)
    const files = Object.keys(zip.files).filter((name) => !zip.files[name].dir)

    // Web formats
    expect(files).toContain('web/favicon-16x16.png')
    expect(files).toContain('web/favicon-32x32.png')
    expect(files).toContain('web/favicon-48x48.png')

    // iOS formats
    expect(files).toContain('ios/apple-touch-icon.png')

    // Android formats
    expect(files).toContain('android/icon-192.png')
    expect(files).toContain('android/icon-512.png')
    expect(files).toContain('android/maskable-icon-192.png')
    expect(files).toContain('android/maskable-icon-512.png')

    // Windows formats
    expect(files).toContain('windows/mstile-150x150.png')

    // Config files at root
    expect(files).toContain('manifest.json')
    expect(files).toContain('browserconfig.xml')

    // Documentation
    expect(files).toContain('snippet.html')
    expect(files).toContain('README.md')
  })

  it('manifest.json contains correct options', async () => {
    mockFetch
      .mockResolvedValueOnce({
        blob: () => Promise.resolve(new Blob(['source-image'])),
      })
      .mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob(['mock-ico'])),
      })

    const result = await generatePremiumZip({
      formats: mockFormats,
      sourceImage: mockSourceImage,
      manifestOptions: mockManifestOptions,
      manifest: mockManifest,
      browserConfig: mockBrowserConfig,
    })

    const zip = await JSZip.loadAsync(result.blob)
    const manifestContent = await zip.file('manifest.json')?.async('text')
    const manifest = JSON.parse(manifestContent!)

    expect(manifest.name).toBe('Test App')
    expect(manifest.short_name).toBe('Test')
    expect(manifest.theme_color).toBe('#000000')
    expect(manifest.background_color).toBe('#ffffff')
  })

  it('snippet.html contains premium sections', async () => {
    mockFetch
      .mockResolvedValueOnce({
        blob: () => Promise.resolve(new Blob(['source-image'])),
      })
      .mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob(['mock-ico'])),
      })

    const result = await generatePremiumZip({
      formats: mockFormats,
      sourceImage: mockSourceImage,
      manifestOptions: mockManifestOptions,
      manifest: mockManifest,
      browserConfig: mockBrowserConfig,
    })

    const zip = await JSZip.loadAsync(result.blob)
    const snippetContent = await zip.file('snippet.html')?.async('text')

    expect(snippetContent).toContain('apple-touch-icon')
    expect(snippetContent).toContain('manifest.json')
    expect(snippetContent).toContain('browserconfig.xml')
  })

  it('README.md contains implementation guide', async () => {
    mockFetch
      .mockResolvedValueOnce({
        blob: () => Promise.resolve(new Blob(['source-image'])),
      })
      .mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob(['mock-ico'])),
      })

    const result = await generatePremiumZip({
      formats: mockFormats,
      sourceImage: mockSourceImage,
      manifestOptions: mockManifestOptions,
      manifest: mockManifest,
      browserConfig: mockBrowserConfig,
    })

    const zip = await JSZip.loadAsync(result.blob)
    const readmeContent = await zip.file('README.md')?.async('text')

    expect(readmeContent).toContain('FaviconForge')
    expect(readmeContent).toContain('Quick Start')
    expect(readmeContent).toContain('Folder Structure')
  })

  it('handles ICO failure gracefully in premium', async () => {
    mockFetch
      .mockResolvedValueOnce({
        blob: () => Promise.resolve(new Blob(['source-image'])),
      })
      .mockResolvedValueOnce({
        ok: false,
      })

    const result = await generatePremiumZip({
      formats: mockFormats,
      sourceImage: mockSourceImage,
      manifestOptions: mockManifestOptions,
      manifest: mockManifest,
      browserConfig: mockBrowserConfig,
    })

    expect(result.warnings).toContain('ico_generation_failed')
    expect(result.blob).toBeInstanceOf(Blob)

    const zip = await JSZip.loadAsync(result.blob)
    // Filter out directory entries (they have .dir = true)
    const files = Object.keys(zip.files).filter((name) => !zip.files[name].dir)

    expect(files).not.toContain('web/favicon.ico')
    expect(files).toContain('README.md')
  })
})
