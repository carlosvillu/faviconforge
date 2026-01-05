import { useState, useEffect, useRef } from 'react'
import { generateAllFormats } from '~/services/faviconGeneration'
import type { FaviconFormat } from '~/services/faviconGeneration.types'
import { useStorage } from '~/hooks/useStorage'
import { prepareFaviconCacheData } from '~/services/faviconCache'

type GenerationState = 'idle' | 'loading' | 'generating' | 'complete' | 'error'

type GeneratedFormat = {
  name: string
  tier: 'free' | 'premium'
  size: number
  blobUrl: string
}

export type UseFaviconGenerationReturn = {
  generationState: GenerationState
  formats: GeneratedFormat[]
  error: string | null
  sourceImageUrl: string | null
  getFaviconUrl: (targetSize: number) => string | null
  retry: () => void
  hasSourceImage: boolean | 'loading'
}

export function useFaviconGeneration(): UseFaviconGenerationReturn {
  const storage = useStorage()
  const [generationState, setGenerationState] = useState<GenerationState>('idle')
  const [formats, setFormats] = useState<GeneratedFormat[]>([])
  const [error, setError] = useState<string | null>(null)
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null)
  const [hasSourceImage, setHasSourceImage] = useState<boolean | 'loading'>('loading')

  // Track source metadata for caching
  const sourceMetadataRef = useRef<{ filename: string; mimeType: string } | null>(null)

  // Track if we've already started generation to avoid double-trigger
  const generationStartedRef = useRef(false)

  // Check for source image when storage is ready
  useEffect(() => {
    let cancelled = false

    if (storage.state === 'loading') {
      // Use timeout to avoid synchronous setState in effect
      const timer = setTimeout(() => {
        if (!cancelled) setHasSourceImage('loading')
      }, 0)
      return () => {
        cancelled = true
        clearTimeout(timer)
      }
    }

    if (storage.state === 'error') {
      const timer = setTimeout(() => {
        if (!cancelled) {
          setHasSourceImage(false)
          setError('storage_not_available')
        }
      }, 0)
      return () => {
        cancelled = true
        clearTimeout(timer)
      }
    }

    // Storage is ready, check for source image
    const checkSource = async () => {
      const sourceData = await storage.getSourceImage()
      if (!cancelled) setHasSourceImage(!!sourceData)
    }
    checkSource()

    return () => {
      cancelled = true
    }
  }, [storage, storage.state, storage.getSourceImage])

  const generateFavicons = async () => {
    if (storage.state !== 'ready') {
      setError('storage_not_available')
      return
    }

    setGenerationState('loading')

    try {
      const sourceData = await storage.getSourceImage()
      if (!sourceData) {
        setError('no_source_image')
        setGenerationState('error')
        return
      }

      // Store metadata for caching later
      sourceMetadataRef.current = {
        filename: sourceData.filename,
        mimeType: sourceData.mimeType,
      }

      // Create object URL for display
      const displayUrl = URL.createObjectURL(sourceData.blob)
      setSourceImageUrl(displayUrl)
      setGenerationState('generating')

      // Generate favicons with Blob directly
      const result = await generateAllFormats({
        imageData: sourceData.blob,
        isPremium: true,
      })

      // Cache the result
      const cacheData = prepareFaviconCacheData(
        result,
        sourceData.blob,
        sourceData.filename,
        sourceData.mimeType
      )
      await storage.setFaviconCache(cacheData)

      // Convert blobs to object URLs for display
      const formatsWithUrls = result.formats.map((format: FaviconFormat) => ({
        name: format.name,
        tier: format.tier,
        size: format.size,
        blobUrl: URL.createObjectURL(format.blob),
      }))

      setFormats(formatsWithUrls)
      setGenerationState('complete')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      setGenerationState('error')
    }
  }

  // Generate on mount when storage is ready
  useEffect(() => {
    if (storage.state === 'ready' && generationState === 'idle' && !generationStartedRef.current) {
      generationStartedRef.current = true
      // Use timeout to avoid synchronous setState in effect
      const timer = setTimeout(() => {
        generateFavicons()
      }, 0)
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storage.state, generationState])

  // Cleanup: Revoke object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (sourceImageUrl) {
        URL.revokeObjectURL(sourceImageUrl)
      }
      formats.forEach((format) => {
        URL.revokeObjectURL(format.blobUrl)
      })
    }
  }, [sourceImageUrl, formats])

  const getFaviconUrl = (targetSize: number): string | null => {
    const format = formats.find((f) => f.size === targetSize)
    return format?.blobUrl ?? null
  }

  const retry = () => {
    // Revoke old URLs before retry
    formats.forEach((format) => URL.revokeObjectURL(format.blobUrl))
    if (sourceImageUrl) URL.revokeObjectURL(sourceImageUrl)

    setFormats([])
    setError(null)
    setSourceImageUrl(null)
    setGenerationState('idle')
    generationStartedRef.current = false
    // Will trigger generation via useEffect
  }

  return {
    generationState,
    formats,
    error,
    sourceImageUrl,
    getFaviconUrl,
    retry,
    hasSourceImage,
  }
}
