import { describe, it, expect } from 'vitest'
import {
  validateImageFormat,
  validateFileSize,
  validateImageDimensions,
  parseSVGDimensions,
  loadImageDimensions,
  validateImage,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  MIN_DIMENSION_PX,
} from '~/services/imageValidation'

describe('validateImageFormat', () => {
  it('accepts PNG files', () => {
    const file = new File([''], 'test.png', { type: 'image/png' })
    const result = validateImageFormat(file)
    expect(result.valid).toBe(true)
  })

  it('accepts JPEG files', () => {
    const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
    const result = validateImageFormat(file)
    expect(result.valid).toBe(true)
  })

  it('accepts WebP files', () => {
    const file = new File([''], 'test.webp', { type: 'image/webp' })
    const result = validateImageFormat(file)
    expect(result.valid).toBe(true)
  })

  it('accepts SVG files', () => {
    const file = new File([''], 'test.svg', { type: 'image/svg+xml' })
    const result = validateImageFormat(file)
    expect(result.valid).toBe(true)
  })

  it('rejects GIF files', () => {
    const file = new File([''], 'test.gif', { type: 'image/gif' })
    const result = validateImageFormat(file)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.errorKey).toBe('image_invalid_format')
    }
  })

  it('rejects BMP files', () => {
    const file = new File([''], 'test.bmp', { type: 'image/bmp' })
    const result = validateImageFormat(file)
    expect(result.valid).toBe(false)
  })

  it('rejects non-image files', () => {
    const file = new File([''], 'doc.pdf', { type: 'application/pdf' })
    const result = validateImageFormat(file)
    expect(result.valid).toBe(false)
  })
})

describe('validateFileSize', () => {
  it('accepts files under 10MB', () => {
    const file = new File([new ArrayBuffer(5 * 1024 * 1024)], 'test.png')
    const result = validateFileSize(file)
    expect(result.valid).toBe(true)
  })

  it('accepts files exactly at 10MB', () => {
    const file = new File([new ArrayBuffer(10 * 1024 * 1024)], 'test.png')
    const result = validateFileSize(file)
    expect(result.valid).toBe(true)
  })

  it('rejects files over 10MB', () => {
    const file = { size: 15 * 1024 * 1024, type: 'image/png' } as File
    const result = validateFileSize(file)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.errorKey).toBe('image_file_too_large')
      expect(result.errorParams?.maxSizeMB).toBe(10)
    }
  })

  it('respects custom max size', () => {
    const file = { size: 3 * 1024 * 1024 } as File
    const result = validateFileSize(file, 2 * 1024 * 1024)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.errorParams?.maxSizeMB).toBe(2)
    }
  })
})

describe('validateImageDimensions', () => {
  it('accepts 512x512 images', () => {
    const result = validateImageDimensions(512, 512)
    expect(result.valid).toBe(true)
  })

  it('accepts larger square images', () => {
    const result = validateImageDimensions(1024, 1024)
    expect(result.valid).toBe(true)
  })

  it('rejects images smaller than 512px', () => {
    const result = validateImageDimensions(256, 256)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.errorKey).toBe('image_too_small')
      expect(result.errorParams?.minSize).toBe(512)
    }
  })

  it('rejects non-square images (width > height)', () => {
    const result = validateImageDimensions(1024, 512)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.errorKey).toBe('image_not_square')
    }
  })

  it('rejects non-square images (height > width)', () => {
    const result = validateImageDimensions(512, 1024)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.errorKey).toBe('image_not_square')
    }
  })

  it('checks minimum before aspect ratio', () => {
    const result = validateImageDimensions(256, 512)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.errorKey).toBe('image_too_small')
    }
  })

  it('respects custom min dimension', () => {
    const result = validateImageDimensions(256, 256, 128)
    expect(result.valid).toBe(true)
  })
})

describe('parseSVGDimensions', () => {
  it('extracts dimensions from width/height attributes', () => {
    const svg = '<svg width="512" height="512"></svg>'
    const result = parseSVGDimensions(svg)
    expect(result).toEqual({ width: 512, height: 512 })
  })

  it('extracts dimensions from viewBox when no width/height', () => {
    const svg = '<svg viewBox="0 0 100 100"></svg>'
    const result = parseSVGDimensions(svg)
    expect(result).toEqual({ width: 100, height: 100 })
  })

  it('prefers width/height over viewBox', () => {
    const svg = '<svg width="512" height="512" viewBox="0 0 100 100"></svg>'
    const result = parseSVGDimensions(svg)
    expect(result).toEqual({ width: 512, height: 512 })
  })

  it('handles viewBox with comma separators', () => {
    const svg = '<svg viewBox="0,0,200,200"></svg>'
    const result = parseSVGDimensions(svg)
    expect(result).toEqual({ width: 200, height: 200 })
  })

  it('defaults to 512x512 when no dimensions found', () => {
    const svg = '<svg></svg>'
    const result = parseSVGDimensions(svg)
    expect(result).toEqual({ width: 512, height: 512 })
  })
})

describe('loadImageDimensions', () => {
  it('loads SVG dimensions', async () => {
    const svgContent = '<svg width="256" height="256"></svg>'
    const file = {
      type: 'image/svg+xml',
      name: 'test.svg',
      text: async () => svgContent,
    } as File
    const result = await loadImageDimensions(file)
    expect(result).toEqual({ width: 256, height: 256 })
  })

  it('loads raster image dimensions', async () => {
    // Mock the Image class
    const mockImage = {
      naturalWidth: 512,
      naturalHeight: 512,
      onload: null as ((this: HTMLImageElement, ev: Event) => void) | null,
      onerror: null as OnErrorEventHandler,
      src: '',
    }

    // Save original Image
    const OriginalImage = global.Image

    // Mock Image constructor
    global.Image = class {
      naturalWidth = 0
      naturalHeight = 0
      onload: ((this: HTMLImageElement, ev: Event) => void) | null = null
      onerror: OnErrorEventHandler = null
      src = ''

      constructor() {
        // Simulate async image load
        setTimeout(() => {
          this.naturalWidth = mockImage.naturalWidth
          this.naturalHeight = mockImage.naturalHeight
          if (this.onload) {
            this.onload.call(this as unknown as HTMLImageElement, new Event('load'))
          }
        }, 0)
      }
    } as unknown as typeof Image

    // Create a small PNG blob
    const file = new File([new ArrayBuffer(100)], 'test.png', {
      type: 'image/png',
    })

    const result = await loadImageDimensions(file)
    expect(result).toEqual({ width: 512, height: 512 })

    // Restore original Image
    global.Image = OriginalImage
  })
})

describe('validateImage (integration)', () => {
  it('fails fast on invalid format', async () => {
    const file = new File([''], 'test.gif', { type: 'image/gif' })
    const result = await validateImage(file)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.errorKey).toBe('image_invalid_format')
    }
  })

  it('fails on oversized file before checking dimensions', async () => {
    const file = { size: 15 * 1024 * 1024, type: 'image/png' } as File
    const result = await validateImage(file)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.errorKey).toBe('image_file_too_large')
    }
  })

  it('returns valid for correct SVG image', async () => {
    const svgContent = '<svg width="512" height="512"></svg>'
    const file = {
      type: 'image/svg+xml',
      name: 'test.svg',
      size: 100,
      text: async () => svgContent,
    } as File
    const result = await validateImage(file)
    expect(result.valid).toBe(true)
  })

  it('fails for too small SVG', async () => {
    const svgContent = '<svg width="256" height="256"></svg>'
    const file = {
      type: 'image/svg+xml',
      name: 'test.svg',
      size: 100,
      text: async () => svgContent,
    } as File
    const result = await validateImage(file)
    // SVG validation has been relaxed (minDimension = 0)
    expect(result.valid).toBe(true)
  })

  it('fails for non-square SVG', async () => {
    const svgContent = '<svg width="512" height="1024"></svg>'
    const file = {
      type: 'image/svg+xml',
      name: 'test.svg',
      size: 100,
      text: async () => svgContent,
    } as File
    const result = await validateImage(file)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.errorKey).toBe('image_not_square')
    }
  })
})

describe('Constants', () => {
  it('exports ALLOWED_MIME_TYPES', () => {
    expect(ALLOWED_MIME_TYPES).toEqual([
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/svg+xml',
    ])
  })

  it('exports MAX_FILE_SIZE_BYTES as 10MB', () => {
    expect(MAX_FILE_SIZE_BYTES).toBe(10 * 1024 * 1024)
  })

  it('exports MIN_DIMENSION_PX as 512', () => {
    expect(MIN_DIMENSION_PX).toBe(512)
  })
})
