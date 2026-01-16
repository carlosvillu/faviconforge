import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  canvasToBlob,
  extractDominantBorderColor,
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
  getImageData: vi.fn(() => ({
    data: new Uint8ClampedArray(512 * 512 * 4), // Default 512x512 image with transparent pixels
    width: 512,
    height: 512,
  })),
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

      expect(results).toHaveLength(9)
      const successResults = results.filter((r) => r.success)
      expect(successResults).toHaveLength(9)

      if (successResults.every((r) => r.success)) {
        const formats = successResults.map((r) => r.success && r.format)
        const premiumFormats = formats.filter((f) => f && f.tier === 'premium')
        expect(premiumFormats).toHaveLength(6)
      }
    })
  })

  describe('generateMaskableFormats', () => {
    it('should generate maskable icons for both sizes', async () => {
      const results = await generateMaskableFormats(validBlob, '#ffffff')

      expect(results).toHaveLength(4)
      const successResults = results.filter((r) => r.success)
      expect(successResults).toHaveLength(4)

      if (successResults.every((r) => r.success)) {
        const formats = successResults.map((r) => r.success && r.format)
        expect(formats.map((f) => f && f.name)).toEqual([
          'icon-192-maskable.png',
          'icon-384-maskable.png',
          'icon-512-maskable.png',
          'icon-1024-maskable.png',
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
      expect(manifest.icons).toHaveLength(8)
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

  describe('extractDominantBorderColor', () => {
    it('should return most frequent border color', async () => {
      // Mock getImageData to return a red border (255, 0, 0, 255)
      const width = 100
      const height = 100
      const imageDataArray = new Uint8ClampedArray(width * height * 4)

      // Fill entire image with transparent pixels first
      for (let i = 0; i < imageDataArray.length; i += 4) {
        imageDataArray[i] = 0
        imageDataArray[i + 1] = 0
        imageDataArray[i + 2] = 0
        imageDataArray[i + 3] = 0
      }

      // Fill border with red (top, bottom, left, right edges)
      // Top row
      for (let x = 0; x < width; x++) {
        const i = (0 * width + x) * 4
        imageDataArray[i] = 255
        imageDataArray[i + 1] = 0
        imageDataArray[i + 2] = 0
        imageDataArray[i + 3] = 255
      }
      // Bottom row
      for (let x = 0; x < width; x++) {
        const i = ((height - 1) * width + x) * 4
        imageDataArray[i] = 255
        imageDataArray[i + 1] = 0
        imageDataArray[i + 2] = 0
        imageDataArray[i + 3] = 255
      }
      // Left column
      for (let y = 1; y < height - 1; y++) {
        const i = (y * width + 0) * 4
        imageDataArray[i] = 255
        imageDataArray[i + 1] = 0
        imageDataArray[i + 2] = 0
        imageDataArray[i + 3] = 255
      }
      // Right column
      for (let y = 1; y < height - 1; y++) {
        const i = (y * width + (width - 1)) * 4
        imageDataArray[i] = 255
        imageDataArray[i + 1] = 0
        imageDataArray[i + 2] = 0
        imageDataArray[i + 3] = 255
      }

      const mockGetImageData = vi.fn(() => ({
        data: imageDataArray,
        width,
        height,
      }))

      HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
        ...mockContext,
        drawImage: vi.fn(),
        getImageData: mockGetImageData,
      })) as unknown as typeof HTMLCanvasElement.prototype.getContext

      global.Image = class {
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        src = ''
        width = width
        height = height
        crossOrigin = ''

        constructor() {
          setTimeout(() => this.onload?.(), 0)
        }
      } as unknown as typeof Image

      const color = await extractDominantBorderColor(validBlob)
      expect(color).toBe('#ff0000')
    })

    it('should ignore transparent pixels', async () => {
      // Mock image with mixed border: some transparent, some blue
      const width = 100
      const height = 100
      const imageDataArray = new Uint8ClampedArray(width * height * 4)

      // Fill with transparent
      for (let i = 0; i < imageDataArray.length; i += 4) {
        imageDataArray[i] = 0
        imageDataArray[i + 1] = 0
        imageDataArray[i + 2] = 0
        imageDataArray[i + 3] = 0
      }

      // Fill top half of border with blue (opaque)
      for (let x = 0; x < width / 2; x++) {
        const i = (0 * width + x) * 4
        imageDataArray[i] = 0
        imageDataArray[i + 1] = 0
        imageDataArray[i + 2] = 255
        imageDataArray[i + 3] = 255
      }
      // Bottom row blue
      for (let x = 0; x < width; x++) {
        const i = ((height - 1) * width + x) * 4
        imageDataArray[i] = 0
        imageDataArray[i + 1] = 0
        imageDataArray[i + 2] = 255
        imageDataArray[i + 3] = 255
      }

      const mockGetImageData = vi.fn(() => ({
        data: imageDataArray,
        width,
        height,
      }))

      HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
        ...mockContext,
        drawImage: vi.fn(),
        getImageData: mockGetImageData,
      })) as unknown as typeof HTMLCanvasElement.prototype.getContext

      global.Image = class {
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        src = ''
        width = width
        height = height
        crossOrigin = ''

        constructor() {
          setTimeout(() => this.onload?.(), 0)
        }
      } as unknown as typeof Image

      const color = await extractDominantBorderColor(validBlob)
      expect(color).toBe('#0000ff')
    })

    it('should return white fallback when all border pixels are transparent', async () => {
      const width = 100
      const height = 100
      const imageDataArray = new Uint8ClampedArray(width * height * 4)

      // Fill entire image with transparent pixels (alpha = 0)
      for (let i = 0; i < imageDataArray.length; i += 4) {
        imageDataArray[i] = 0
        imageDataArray[i + 1] = 0
        imageDataArray[i + 2] = 0
        imageDataArray[i + 3] = 0
      }

      const mockGetImageData = vi.fn(() => ({
        data: imageDataArray,
        width,
        height,
      }))

      HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
        ...mockContext,
        drawImage: vi.fn(),
        getImageData: mockGetImageData,
      })) as unknown as typeof HTMLCanvasElement.prototype.getContext

      global.Image = class {
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        src = ''
        width = width
        height = height
        crossOrigin = ''

        constructor() {
          setTimeout(() => this.onload?.(), 0)
        }
      } as unknown as typeof Image

      const color = await extractDominantBorderColor(validBlob)
      expect(color).toBe('#ffffff')
    })

    it('should pick most frequent color in multi-color border', async () => {
      const width = 100
      const height = 100
      const imageDataArray = new Uint8ClampedArray(width * height * 4)

      // Fill with transparent
      for (let i = 0; i < imageDataArray.length; i += 4) {
        imageDataArray[i] = 0
        imageDataArray[i + 1] = 0
        imageDataArray[i + 2] = 0
        imageDataArray[i + 3] = 0
      }

      // Fill 60% of border with red, 40% with blue
      // Top row: 60% red, 40% blue
      for (let x = 0; x < width * 0.6; x++) {
        const i = (0 * width + x) * 4
        imageDataArray[i] = 255
        imageDataArray[i + 1] = 0
        imageDataArray[i + 2] = 0
        imageDataArray[i + 3] = 255
      }
      for (let x = Math.floor(width * 0.6); x < width; x++) {
        const i = (0 * width + x) * 4
        imageDataArray[i] = 0
        imageDataArray[i + 1] = 0
        imageDataArray[i + 2] = 255
        imageDataArray[i + 3] = 255
      }
      // Bottom row: all red (to ensure red dominates)
      for (let x = 0; x < width; x++) {
        const i = ((height - 1) * width + x) * 4
        imageDataArray[i] = 255
        imageDataArray[i + 1] = 0
        imageDataArray[i + 2] = 0
        imageDataArray[i + 3] = 255
      }

      const mockGetImageData = vi.fn(() => ({
        data: imageDataArray,
        width,
        height,
      }))

      HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
        ...mockContext,
        drawImage: vi.fn(),
        getImageData: mockGetImageData,
      })) as unknown as typeof HTMLCanvasElement.prototype.getContext

      global.Image = class {
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        src = ''
        width = width
        height = height
        crossOrigin = ''

        constructor() {
          setTimeout(() => this.onload?.(), 0)
        }
      } as unknown as typeof Image

      const color = await extractDominantBorderColor(validBlob)
      expect(color).toBe('#ff0000')
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

    it('should use extracted border color for maskable icons instead of backgroundColor', async () => {
      // Mock image with green border
      const width = 100
      const height = 100
      const imageDataArray = new Uint8ClampedArray(width * height * 4)

      // Fill with transparent
      for (let i = 0; i < imageDataArray.length; i += 4) {
        imageDataArray[i] = 0
        imageDataArray[i + 1] = 0
        imageDataArray[i + 2] = 0
        imageDataArray[i + 3] = 0
      }

      // Fill border with green (0, 255, 0, 255)
      // Top row
      for (let x = 0; x < width; x++) {
        const i = (0 * width + x) * 4
        imageDataArray[i] = 0
        imageDataArray[i + 1] = 255
        imageDataArray[i + 2] = 0
        imageDataArray[i + 3] = 255
      }
      // Bottom row
      for (let x = 0; x < width; x++) {
        const i = ((height - 1) * width + x) * 4
        imageDataArray[i] = 0
        imageDataArray[i + 1] = 255
        imageDataArray[i + 2] = 0
        imageDataArray[i + 3] = 255
      }
      // Left column
      for (let y = 1; y < height - 1; y++) {
        const i = (y * width + 0) * 4
        imageDataArray[i] = 0
        imageDataArray[i + 1] = 255
        imageDataArray[i + 2] = 0
        imageDataArray[i + 3] = 255
      }
      // Right column
      for (let y = 1; y < height - 1; y++) {
        const i = (y * width + (width - 1)) * 4
        imageDataArray[i] = 0
        imageDataArray[i + 1] = 255
        imageDataArray[i + 2] = 0
        imageDataArray[i + 3] = 255
      }

      // Track calls to getContext and getImageData
      const mockGetImageData = vi.fn(() => ({
        data: imageDataArray,
        width,
        height,
      }))

      // Track fillStyle to verify the color used
      let capturedFillStyle = ''
      const enhancedMockContext = {
        ...mockContext,
        drawImage: vi.fn(),
        getImageData: mockGetImageData,
        fillRect: vi.fn(),
        get fillStyle() {
          return capturedFillStyle
        },
        set fillStyle(value: string) {
          capturedFillStyle = value
        },
      }

      HTMLCanvasElement.prototype.getContext = vi.fn(() => enhancedMockContext) as unknown as typeof HTMLCanvasElement.prototype.getContext

      global.Image = class {
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        src = ''
        width = width
        height = height
        crossOrigin = ''

        constructor() {
          setTimeout(() => this.onload?.(), 0)
        }
      } as unknown as typeof Image

      const result = await generateAllFormats({
        imageData: validBlob,
        isPremium: true,
        manifestOptions: {
          name: 'My App',
          shortName: 'App',
          themeColor: '#000000',
          backgroundColor: '#ffffff', // White, but should NOT be used for maskable padding
        },
      })

      // The fillStyle should be green (#00ff00), NOT white (#ffffff)
      expect(capturedFillStyle).toBe('#00ff00')

      // Verify manifest still uses the backgroundColor from manifestOptions
      expect(result.manifest).toContain('"background_color": "#ffffff"')
    })
  })
})
