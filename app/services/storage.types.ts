export type SourceImageData = {
  id: 'source_image'
  blob: Blob
  filename: string
  mimeType: string
  timestamp: number
}

export type CachedFaviconFormat = {
  name: string
  blob: Blob
  path: string
  size: number
  tier: 'free' | 'premium'
  mimeType: string
}

export type FaviconCacheData = {
  id: 'favicon_cache'
  formats: CachedFaviconFormat[]
  manifest: string | null
  browserConfig: string | null
  htmlSnippet: string
  sourceImage: {
    blob: Blob
    filename: string
    mimeType: string
  }
  timestamp: number
}
