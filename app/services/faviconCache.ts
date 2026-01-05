import type { GeneratedFavicons } from './faviconGeneration.types'
import type { FaviconCacheData, CachedFaviconFormat } from './storage.types'

/**
 * Converts GeneratedFavicons to cacheable format.
 * Called from useFaviconGeneration with storage instance.
 */
export function prepareFaviconCacheData(
  data: GeneratedFavicons,
  sourceBlob: Blob,
  sourceFilename: string,
  sourceMimeType: string
): Omit<FaviconCacheData, 'id'> {
  const formats: CachedFaviconFormat[] = data.formats.map((format) => ({
    name: format.name,
    blob: format.blob,
    path: format.path,
    size: format.size,
    tier: format.tier,
    mimeType: format.blob.type,
  }))

  return {
    formats,
    manifest: data.manifest,
    browserConfig: data.browserConfig,
    htmlSnippet: data.htmlSnippet,
    sourceImage: {
      blob: sourceBlob,
      filename: sourceFilename,
      mimeType: sourceMimeType,
    },
    timestamp: Date.now(),
  }
}

/**
 * Restores GeneratedFavicons from cached data.
 */
export function restoreFaviconsFromCacheData(
  cached: FaviconCacheData
): GeneratedFavicons {
  return {
    formats: cached.formats.map((format) => ({
      name: format.name,
      blob: format.blob,
      path: format.path,
      size: format.size,
      tier: format.tier,
    })),
    warnings: [],
    manifest: cached.manifest,
    browserConfig: cached.browserConfig,
    htmlSnippet: cached.htmlSnippet,
  }
}
