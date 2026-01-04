import { useState, useEffect } from 'react'
import { generateAllFormats } from '~/services/faviconGeneration'
import type { FaviconFormat } from '~/services/faviconGeneration.types'
import { cacheFavicons } from '~/services/faviconCache'

type GenerationState = 'idle' | 'generating' | 'complete' | 'error'

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
  sourceImage: string | null
  getFaviconUrl: (targetSize: number) => string | null
  retry: () => void
  hasSourceImage: boolean
}

function getSourceImage(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem('faviconforge_source_image')
}

export function useFaviconGeneration(): UseFaviconGenerationReturn {
  const [generationState, setGenerationState] =
    useState<GenerationState>('idle')
  const [formats, setFormats] = useState<GeneratedFormat[]>([])
  const [error, setError] = useState<string | null>(null)
  const [sourceImage, setSourceImage] = useState<string | null>(null)

  const generateFavicons = async () => {
    const source = getSourceImage()
    if (!source) {
      setError('no_source_image')
      return
    }

    setSourceImage(source)
    setGenerationState('generating')

    try {
      const result = await generateAllFormats({
        imageData: source,
        isPremium: true,
      })

      await cacheFavicons(result, source)

      // Convert blobs to object URLs
      const formatsWithUrls = result.formats.map((format: FaviconFormat) => ({
        name: format.name,
        tier: format.tier,
        size: format.size,
        blobUrl: URL.createObjectURL(format.blob),
      }))

      setFormats(formatsWithUrls)
      setGenerationState('complete')
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      setGenerationState('error')
    }
  }

  // Generate on mount
  useEffect(() => {
    generateFavicons()

    // Cleanup: Revoke object URLs to prevent memory leaks
    return () => {
      formats.forEach((format) => {
        URL.revokeObjectURL(format.blobUrl)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getFaviconUrl = (targetSize: number): string | null => {
    const format = formats.find((f) => f.size === targetSize)
    return format?.blobUrl ?? null
  }

  const retry = () => {
    setFormats([])
    setError(null)
    generateFavicons()
  }

  return {
    generationState,
    formats,
    error,
    sourceImage,
    getFaviconUrl,
    retry,
    hasSourceImage: !!getSourceImage(),
  }
}
