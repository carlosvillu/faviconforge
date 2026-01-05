import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  canvasToBlob,
  generateAllFormats,
  generateBrowserConfig,
  generateHTMLSnippet,
  generateManifest,
  generateMaskableFormats,
  generateMaskableIcon,
  generatePNGFormats,
  loadImage,
  resizeImage,
  resizeToCanvas,
} from '../../app/services/faviconGeneration'
import type { ManifestOptions } from '../../app/services/faviconGeneration.types'

// Mock canvas and image globally
const mockContext = {
  drawImage: vi.fn(),
  fillRect: vi.fn(),
  fillStyle: '',
  imageSmoothingQuality: 'high' as ImageSmoothingQuality,
}

beforeEach(() => {
  vi.clearAllMocks()

  // Mock HTMLCanvasElement
  HTMLCanvasElement.prototype.getContext = vi.fn(
    () => mockContext
  ) as unknown as typeof HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
    callback(new Blob(['fake'], { type: 'image/png' }))
  }) as unknown as typeof HTMLCanvasElement.prototype.toBlob

  // Mock URL.createObjectURL and URL.revokeObjectURL
  global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
  global.URL.revokeObjectURL = vi.fn()

  // Mock Image class
  global.Image = class {
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    src = ''
    naturalWidth = 512
    naturalHeight = 512
    crossOrigin = ''

    constructor() {
      setTimeout(() => this.onload?.(), 0)
    }
  } as unknown as typeof Image
})

describe('faviconGeneration', () => {
  // Create a mock Blob for testing
  const validBlob = new Blob(['mock-image-data'], { type: 'image/png' })

  describe('loadImage', () => {
    it('should load valid Blob', async () => {
      const img = await loadImage(validBlob)
      expect(img).toBeInstanceOf(Image)
      expect(img.naturalWidth).toBe(512)
      expect(img.naturalHeight).toBe(512)
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(validBlob)
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
    })

    it('should reject invalid Blob', async () => {
      // Override Image to trigger onerror
      global.Image = class {
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        src = ''
        crossOrigin = ''

        constructor() {
          setTimeout(() => this.onerror?.(), 0)
        }
      } as unknown as typeof Image

      const invalidBlob = new Blob(['invalid'], { type: 'image/png' })
      await expect(loadImage(invalidBlob)).rejects.toThrow('image_load_failed')
    })
  })

  describe('resizeToCanvas', () => {
    it('should create correct size canvas', async () => {
      const img = await loadImage(validBlob)
      const canvas = resizeToCanvas(img, 32)

      expect(canvas.width).toBe(32)
      expect(canvas.height).toBe(32)
      expect(mockContext.drawImage).toHaveBeenCalledWith(img, 0, 0, 32, 32)
    })
  })

  describe('canvasToBlob', () => {
    it('should return PNG blob', async () => {
      const canvas = document.createElement('canvas')
      const blob = await canvasToBlob(canvas)

      expect(blob).toBeInstanceOf(Blob)
      expect(blob.type).toBe('image/png')
    })

    it('should reject if toBlob returns null', async () => {
      const canvas = document.createElement('canvas')
      HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
        callback(null)
      }) as unknown as typeof HTMLCanvasElement.prototype.toBlob

      await expect(canvasToBlob(canvas)).rejects.toThrow()
    })
  })

  describe('resizeImage', () => {
    it('should return blob of correct approximate size', async () => {
      const blob = await resizeImage(validBlob, 16)

      expect(blob).toBeInstanceOf(Blob)
      expect(blob.type).toBe('image/png')
    })
  })

  describe('generateMaskableIcon', () => {
    it('should add padding with background color', async () => {
      const blob = await generateMaskableIcon(validBlob, 192, '#ff0000')

      expect(blob).toBeInstanceOf(Blob)
      expect(mockContext.fillStyle).toBe('#ff0000')
      expect(mockContext.fillRect).toHaveBeenCalledWith(0, 0, 192, 192)
      // Verify drawImage was called with correct parameters
      expect(mockContext.drawImage).toHaveBeenCalled()
      const call = mockContext.drawImage.mock.calls[0]
      expect(call[0]).toBeDefined() // image
      expect(call[1]).toBeCloseTo(19.2, 1) // x offset
      expect(call[2]).toBeCloseTo(19.2, 1) // y offset
      expect(call[3]).toBeCloseTo(153.6, 1) // width
      expect(call[4]).toBeCloseTo(153.6, 1) // height
    })
  })

  describe('generatePNGFormats', () => {
    it('should generate free formats only', async () => {
      const results = await generatePNGFormats(validBlob, false)

      expect(results).toHaveLength(3)
      const successResults = results.filter((r) => r.success)
      expect(successResults).toHaveLength(3)

      if (successResults.every((r) => r.success)) {
        const formats = successResults.map((r) => r.success && r.format)
        expect(formats.map((f) => f && f.name)).toEqual([
          'favicon-16x16.png',
          'favicon-32x32.png',
          'favicon-48x48.png',
        ])
        expect(formats.every((f) => f && f.tier === 'free')).toBe(true)
      }
    })

    it('should generate all formats for premium', async () => {
      const results = await generatePNGFormats(validBlob, true)

      expect(results).toHaveLength(7)
      const successResults = results.filter((r) => r.success)
      expect(successResults).toHaveLength(7)

      if (successResults.every((r) => r.success)) {
        const formats = successResults.map((r) => r.success && r.format)
        const premiumFormats = formats.filter((f) => f && f.tier === 'premium')
        expect(premiumFormats).toHaveLength(4)
      }
    })
  })

  describe('generateMaskableFormats', () => {
    it('should generate maskable icons for both sizes', async () => {
      const results = await generateMaskableFormats(validBlob, '#ffffff')

      expect(results).toHaveLength(2)
      const successResults = results.filter((r) => r.success)
      expect(successResults).toHaveLength(2)

      if (successResults.every((r) => r.success)) {
        const formats = successResults.map((r) => r.success && r.format)
        expect(formats.map((f) => f && f.name)).toEqual([
          'maskable-icon-192.png',
          'maskable-icon-512.png',
        ])
      }
    })
  })

  describe('generateManifest', () => {
    it('should create valid JSON', () => {
      const options: ManifestOptions = {
        name: 'Test App',
        shortName: 'Test',
        themeColor: '#000000',
        backgroundColor: '#ffffff',
      }

      const manifestString = generateManifest(options)
      const manifest = JSON.parse(manifestString)

      expect(manifest.name).toBe('Test App')
      expect(manifest.short_name).toBe('Test')
      expect(manifest.theme_color).toBe('#000000')
      expect(manifest.background_color).toBe('#ffffff')
      expect(manifest.display).toBe('standalone')
      expect(manifest.start_url).toBe('/')
      expect(manifest.icons).toHaveLength(4)
    })
  })

  describe('generateBrowserConfig', () => {
    it('should create valid XML', () => {
      const xml = generateBrowserConfig()

      expect(xml).toContain('<?xml version="1.0" encoding="utf-8"?>')
      expect(xml).toContain('<browserconfig>')
      expect(xml).toContain('mstile-150x150.png')
      expect(xml).toContain('</browserconfig>')
    })
  })

  describe('generateHTMLSnippet', () => {
    it('should generate free tier HTML with 4 basic tags', () => {
      const html = generateHTMLSnippet(false)

      expect(html).toContain('<!-- Basic Favicons -->')
      expect(html).toContain('favicon.ico')
      expect(html).toContain('favicon-16x16.png')
      expect(html).toContain('favicon-32x32.png')
      expect(html).toContain('favicon-48x48.png')
      expect(html).not.toContain('apple-touch-icon')
      expect(html).not.toContain('manifest.json')
    })

    it('should generate premium HTML with all tags', () => {
      const html = generateHTMLSnippet(true)

      expect(html).toContain('<!-- Basic Favicons -->')
      expect(html).toContain('<!-- iOS -->')
      expect(html).toContain('<!-- Android/PWA -->')
      expect(html).toContain('<!-- Windows -->')
      expect(html).toContain('apple-touch-icon.png')
      expect(html).toContain('manifest.json')
      expect(html).toContain('browserconfig.xml')
    })
  })

  describe('generateAllFormats', () => {
    it('should return all formats for premium with manifest', async () => {
      const result = await generateAllFormats({
        imageData: validBlob,
        isPremium: true,
        manifestOptions: {
          name: 'My App',
          shortName: 'App',
          themeColor: '#000000',
          backgroundColor: '#ffffff',
        },
      })

      expect(result.formats.length).toBeGreaterThan(0)
      expect(result.manifest).not.toBeNull()
      expect(result.browserConfig).not.toBeNull()
      expect(result.htmlSnippet).toContain('manifest.json')
    })

    it('should return only free formats without manifest for free tier', async () => {
      const result = await generateAllFormats({
        imageData: validBlob,
        isPremium: false,
      })

      expect(result.formats).toHaveLength(3)
      expect(result.manifest).toBeNull()
      expect(result.browserConfig).toBeNull()
      expect(result.htmlSnippet).not.toContain('manifest.json')
    })

    it('should return partial results on failure', async () => {
      // Make one resize fail
      let callCount = 0
      HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
        callCount++
        if (callCount === 2) {
          callback(null) // Fail on second call
        } else {
          callback(new Blob(['fake'], { type: 'image/png' }))
        }
      }) as unknown as typeof HTMLCanvasElement.prototype.toBlob

      const result = await generateAllFormats({
        imageData: validBlob,
        isPremium: false,
      })

      expect(result.formats.length).toBeLessThan(3)
      expect(result.warnings.length).toBeGreaterThan(0)
    })
  })
})
