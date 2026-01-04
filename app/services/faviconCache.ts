import type { GeneratedFavicons } from './faviconGeneration.types'

const CACHE_KEY = 'faviconforge_favicon_cache'

type CachedFaviconFormat = {
  name: string
  base64: string
  path: string
  size: number
  tier: 'free' | 'premium'
  type: string
}

export type CachedFavicons = {
  formats: CachedFaviconFormat[]
  manifest: string | null
  browserConfig: string | null
  htmlSnippet: string
  sourceImage: string
  timestamp: number
}

export async function cacheFavicons(
  data: GeneratedFavicons,
  sourceImage: string
): Promise<void> {
  const formats = await Promise.all(
    data.formats.map(async (format) => {
      const base64 = await blobToBase64(format.blob)
      return {
        name: format.name,
        base64,
        path: format.path,
        size: format.size,
        tier: format.tier,
        type: format.blob.type,
      } satisfies CachedFaviconFormat
    })
  )

  const cached: CachedFavicons = {
    formats,
    manifest: data.manifest,
    browserConfig: data.browserConfig,
    htmlSnippet: data.htmlSnippet,
    sourceImage,
    timestamp: Date.now(),
  }

  sessionStorage.setItem(CACHE_KEY, JSON.stringify(cached))
}

export function getCachedFavicons(): CachedFavicons | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null

    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null

    return parsed as CachedFavicons
  } catch {
    return null
  }
}

export function restoreFaviconsFromCache(): GeneratedFavicons | null {
  const cached = getCachedFavicons()
  if (!cached) return null

  try {
    return {
      formats: cached.formats.map((format) => ({
        name: format.name,
        blob: base64ToBlob(format.base64, format.type),
        path: format.path,
        size: format.size,
        tier: format.tier,
      })),
      warnings: [],
      manifest: cached.manifest,
      browserConfig: cached.browserConfig,
      htmlSnippet: cached.htmlSnippet,
    }
  } catch {
    return null
  }
}

export function clearFaviconCache(): void {
  sessionStorage.removeItem(CACHE_KEY)
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('blob_to_base64_failed'))
      }
    }
    reader.onerror = () => reject(new Error('blob_to_base64_failed'))
    reader.readAsDataURL(blob)
  })
}

function base64ToBlob(base64: string, contentType: string): Blob {
  const parts = base64.split(',')
  const dataPart = parts.length > 1 ? parts[1] : base64

  const byteString = atob(dataPart)
  const arrayBuffer = new ArrayBuffer(byteString.length)
  const uint8Array = new Uint8Array(arrayBuffer)

  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i)
  }

  return new Blob([uint8Array], { type: contentType })
}
