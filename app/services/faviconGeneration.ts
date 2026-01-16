import type {
  FaviconFormat,
  FaviconGenerationOptions,
  GeneratedFavicons,
  GenerationResult,
  ManifestOptions,
} from './faviconGeneration.types'
import {
  DEFAULT_MANIFEST_OPTIONS,
  FREE_SIZES,
  MASKABLE_SIZES,
  PREMIUM_SIZES,
} from './faviconGeneration.types'

// ============ LOW-LEVEL UTILITIES ============

/**
 * Converts RGB values to hex color string
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0')
}

/**
 * Extracts the dominant color from the 1px border of an image
 * Returns the most frequent opaque color as hex, or '#ffffff' if all pixels are transparent
 */
export async function extractDominantBorderColor(imageData: Blob): Promise<string> {
  const img = await loadImage(imageData)
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }

  ctx.drawImage(img, 0, 0)
  const data = ctx.getImageData(0, 0, img.width, img.height).data

  // Count color frequencies
  const colorCount = new Map<string, number>()

  // Extract border pixels (1px wide)
  const width = img.width
  const height = img.height

  // Top row (y=0, x=0 to width-1)
  for (let x = 0; x < width; x++) {
    const i = (0 * width + x) * 4
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const a = data[i + 3]
    if (a >= 128) {
      const hex = rgbToHex(r, g, b)
      colorCount.set(hex, (colorCount.get(hex) || 0) + 1)
    }
  }

  // Bottom row (y=height-1, x=0 to width-1)
  for (let x = 0; x < width; x++) {
    const i = ((height - 1) * width + x) * 4
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const a = data[i + 3]
    if (a >= 128) {
      const hex = rgbToHex(r, g, b)
      colorCount.set(hex, (colorCount.get(hex) || 0) + 1)
    }
  }

  // Left column (x=0, y=1 to height-2, corners already counted)
  for (let y = 1; y < height - 1; y++) {
    const i = (y * width + 0) * 4
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const a = data[i + 3]
    if (a >= 128) {
      const hex = rgbToHex(r, g, b)
      colorCount.set(hex, (colorCount.get(hex) || 0) + 1)
    }
  }

  // Right column (x=width-1, y=1 to height-2, corners already counted)
  for (let y = 1; y < height - 1; y++) {
    const i = (y * width + (width - 1)) * 4
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const a = data[i + 3]
    if (a >= 128) {
      const hex = rgbToHex(r, g, b)
      colorCount.set(hex, (colorCount.get(hex) || 0) + 1)
    }
  }

  // Find most frequent color
  if (colorCount.size === 0) {
    return '#ffffff' // Fallback if all border pixels are transparent
  }

  let maxCount = 0
  let dominantColor = '#ffffff'
  for (const [color, count] of colorCount.entries()) {
    if (count > maxCount) {
      maxCount = count
      dominantColor = color
    }
  }

  return dominantColor
}

/**
 * Loads an image from a Blob
 */
export function loadImage(source: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    const objectUrl = URL.createObjectURL(source)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl) // Clean up after load
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl) // Clean up on error too
      reject(new Error('image_load_failed'))
    }
    img.src = objectUrl
  })
}

/**
 * Resizes an image to a canvas of the specified size
 */
export function resizeToCanvas(
  img: HTMLImageElement,
  size: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, size, size)
  return canvas
}

/**
 * Converts a canvas to a Blob
 */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type = 'image/png'
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('Failed to convert canvas to blob'))
      }
    }, type)
  })
}

// ============ FORMAT GENERATORS ============

/**
 * Resizes an image to the specified size and returns a PNG Blob
 */
export async function resizeImage(
  imageData: Blob,
  size: number
): Promise<Blob> {
  const img = await loadImage(imageData)
  const canvas = resizeToCanvas(img, size)
  return canvasToBlob(canvas)
}

/**
 * Generates a maskable icon with 80% content and background padding
 */
export async function generateMaskableIcon(
  imageData: Blob,
  size: number,
  backgroundColor: string
): Promise<Blob> {
  const img = await loadImage(imageData)
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }

  // Fill background
  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, size, size)

  // Calculate 80% scale (safe zone)
  const scaledSize = size * 0.8
  const offset = (size - scaledSize) / 2

  // Draw scaled image centered
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, offset, offset, scaledSize, scaledSize)

  return canvasToBlob(canvas)
}

/**
 * Generates all PNG formats based on tier
 */
export async function generatePNGFormats(
  imageData: Blob,
  isPremium: boolean
): Promise<GenerationResult[]> {
  const sizes = isPremium
    ? [...FREE_SIZES, ...PREMIUM_SIZES]
    : [...FREE_SIZES]

  const sizeToFormat: Record<number, { name: string; path: string; tier: 'free' | 'premium' }> = {
    16: { name: 'favicon-16x16.png', path: 'web/', tier: 'free' },
    32: { name: 'favicon-32x32.png', path: 'web/', tier: 'free' },
    48: { name: 'favicon-48x48.png', path: 'web/', tier: 'free' },
    180: { name: 'apple-touch-icon.png', path: 'ios/', tier: 'premium' },
    192: { name: 'icon-192.png', path: 'android/', tier: 'premium' },
    384: { name: 'icon-384.png', path: 'android/', tier: 'premium' },
    512: { name: 'icon-512.png', path: 'android/', tier: 'premium' },
    1024: { name: 'icon-1024.png', path: 'android/', tier: 'premium' },
    150: { name: 'mstile-150x150.png', path: 'windows/', tier: 'premium' },
  }

  const results = await Promise.allSettled(
    sizes.map(async (size) => {
      const blob = await resizeImage(imageData, size)
      const formatInfo = sizeToFormat[size]
      const format: FaviconFormat = {
        name: formatInfo.name,
        blob,
        path: formatInfo.path,
        size,
        tier: formatInfo.tier,
      }
      return format
    })
  )

  return results.map((result, index) => {
    const size = sizes[index]
    const formatInfo = sizeToFormat[size]
    if (result.status === 'fulfilled') {
      return { success: true, format: result.value }
    } else {
      return {
        success: false,
        formatName: formatInfo.name,
        error: result.reason?.message || 'Unknown error',
      }
    }
  })
}

/**
 * Generates maskable icon formats (premium only)
 */
export async function generateMaskableFormats(
  imageData: Blob,
  backgroundColor: string
): Promise<GenerationResult[]> {
  const sizeToFormat: Record<number, { name: string; path: string }> = {
    192: { name: 'icon-192-maskable.png', path: 'android/' },
    384: { name: 'icon-384-maskable.png', path: 'android/' },
    512: { name: 'icon-512-maskable.png', path: 'android/' },
    1024: { name: 'icon-1024-maskable.png', path: 'android/' },
  }

  const results = await Promise.allSettled(
    Array.from(MASKABLE_SIZES).map(async (size) => {
      const blob = await generateMaskableIcon(imageData, size, backgroundColor)
      const formatInfo = sizeToFormat[size]
      const format: FaviconFormat = {
        name: formatInfo.name,
        blob,
        path: formatInfo.path,
        size,
        tier: 'premium',
      }
      return format
    })
  )

  return results.map((result, index) => {
    const size = MASKABLE_SIZES[index]
    const formatInfo = sizeToFormat[size]
    if (result.status === 'fulfilled') {
      return { success: true, format: result.value }
    } else {
      return {
        success: false,
        formatName: formatInfo.name,
        error: result.reason?.message || 'Unknown error',
      }
    }
  })
}

// ============ METADATA GENERATORS ============

/**
 * Generates a manifest.json string
 */
export function generateManifest(options: ManifestOptions): string {
  const manifest = {
    name: options.name,
    short_name: options.shortName,
    theme_color: options.themeColor,
    background_color: options.backgroundColor,
    display: 'standalone',
    start_url: '/',
    icons: [
      {
        src: '/android/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/android/icon-192-maskable.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/android/icon-384.png',
        sizes: '384x384',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/android/icon-384-maskable.png',
        sizes: '384x384',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/android/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/android/icon-512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/android/icon-1024.png',
        sizes: '1024x1024',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/android/icon-1024-maskable.png',
        sizes: '1024x1024',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }

  return JSON.stringify(manifest, null, 2)
}

/**
 * Generates a browserconfig.xml string
 */
export function generateBrowserConfig(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square150x150logo src="/windows/mstile-150x150.png"/>
      <TileColor>#ffffff</TileColor>
    </tile>
  </msapplication>
</browserconfig>`
}

/**
 * Generates an HTML snippet with documented sections
 */
export function generateHTMLSnippet(
  isPremium: boolean,
  manifestOptions?: ManifestOptions
): string {
  const basicFavicons = `<!-- Basic Favicons -->
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="16x16" href="/web/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/web/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="48x48" href="/web/favicon-48x48.png">`

  if (!isPremium) {
    return basicFavicons
  }

  const themeColor = manifestOptions?.themeColor ?? DEFAULT_MANIFEST_OPTIONS.themeColor
  const appName = manifestOptions?.shortName ?? DEFAULT_MANIFEST_OPTIONS.shortName

  return `${basicFavicons}

<!-- iOS -->
<link rel="apple-touch-icon" sizes="180x180" href="/ios/apple-touch-icon.png">

<!-- Android/PWA -->
<link rel="icon" type="image/png" sizes="192x192" href="/android/icon-192.png">
<link rel="icon" type="image/png" sizes="512x512" href="/android/icon-512.png">
<link rel="manifest" href="/manifest.json">

<!-- Windows -->
<meta name="msapplication-TileImage" content="/windows/mstile-150x150.png">
<meta name="msapplication-config" content="/browserconfig.xml">

<!-- Theme & PWA Meta -->
<meta name="theme-color" content="${themeColor}">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="${appName}">
<meta name="mobile-web-app-capable" content="yes">`
}

// ============ MAIN ORCHESTRATOR ============

/**
 * Generates all favicon formats based on options
 */
export async function generateAllFormats(
  options: FaviconGenerationOptions
): Promise<GeneratedFavicons> {
  const { imageData, isPremium, manifestOptions } = options
  const warnings: string[] = []
  const formats: FaviconFormat[] = []

  // Generate PNG formats
  const pngResults = await generatePNGFormats(imageData, isPremium)
  for (const result of pngResults) {
    if (result.success) {
      formats.push(result.format)
    } else {
      warnings.push(`${result.formatName}: ${result.error}`)
    }
  }

  // Generate maskable formats (premium only)
  if (isPremium) {
    // Extract dominant border color for maskable icon padding
    const paddingColor = await extractDominantBorderColor(imageData)
    const maskableResults = await generateMaskableFormats(imageData, paddingColor)
    for (const result of maskableResults) {
      if (result.success) {
        formats.push(result.format)
      } else {
        warnings.push(`${result.formatName}: ${result.error}`)
      }
    }
  }

  // Generate manifest and browserConfig (premium only)
  const manifest = isPremium
    ? generateManifest(manifestOptions || DEFAULT_MANIFEST_OPTIONS)
    : null
  const browserConfig = isPremium ? generateBrowserConfig() : null

  // Generate HTML snippet
  const htmlSnippet = generateHTMLSnippet(isPremium, manifestOptions)

  return {
    formats,
    warnings,
    manifest,
    browserConfig,
    htmlSnippet,
  }
}
