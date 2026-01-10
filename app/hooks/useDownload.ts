import { useState, useEffect } from 'react'
import type { GeneratedFavicons } from '~/services/faviconGeneration.types'
import { useStorage } from '~/hooks/useStorage'
import { restoreFaviconsFromCacheData } from '~/services/faviconCache'
import { generateFreeZip, generatePremiumZip } from '~/services/zipGeneration'
import { DEFAULT_MANIFEST_OPTIONS } from '~/services/faviconGeneration.types'
import type { ZipResult } from '~/services/zipGeneration.types'

type DownloadState = 'idle' | 'generating' | 'ready' | 'error'


type UseDownloadParams = {
  isPremium: boolean
  isLoggedIn: boolean
  autoDownload?: boolean
}

export type UseDownloadReturn = {
  selectedTier: 'free' | 'premium'
  setSelectedTier: (tier: 'free' | 'premium') => void
  downloadState: DownloadState
  warnings: string[]
  zipBlob: Blob | null
  zipFilename: string
  triggerDownload: () => Promise<void>
  generateZip: () => Promise<ZipResult | null>
  canDownloadPremium: boolean
  hasSourceImage: boolean | 'loading'
}

export function useDownload(params: UseDownloadParams): UseDownloadReturn {
  const { isPremium, isLoggedIn, autoDownload = false } = params

  const storage = useStorage()
  const [selectedTier, setSelectedTier] = useState<'free' | 'premium'>(
    isPremium ? 'premium' : 'free'
  )
  const [downloadState, setDownloadState] = useState<DownloadState>('idle')
  const [zipBlob, setZipBlob] = useState<Blob | null>(null)
  const [zipFilename, setZipFilename] = useState<string>('')
  const [warnings, setWarnings] = useState<string[]>([])
  const [hasSourceImage, setHasSourceImage] = useState<boolean | 'loading'>('loading')

  const canDownloadPremium = isLoggedIn && isPremium

  // Sync selectedTier when isPremium changes (e.g., after webhook grants premium)
  useEffect(() => {
    if (isPremium) {
      setSelectedTier('premium')
    }
  }, [isPremium])

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
        if (!cancelled) setHasSourceImage(false)
      }, 0)
      return () => {
        cancelled = true
        clearTimeout(timer)
      }
    }

    const checkCache = async () => {
      const cached = await storage.getFaviconCache()
      if (!cancelled) setHasSourceImage(cached !== null)
    }
    checkCache()

    return () => {
      cancelled = true
    }
  }, [storage, storage.state, storage.getFaviconCache])

  const generateZip = async (): Promise<ZipResult | null> => {
    try {
      setDownloadState('generating')

      const cached = await storage.getFaviconCache()
      if (!cached) {
        setDownloadState('error')
        return null
      }

      const restored = restoreFaviconsFromCacheData(cached)

      const result = await generateZipForTier({
        selectedTier,
        generatedFavicons: restored,
        sourceImageBlob: cached.sourceImage.blob,
      })

      setWarnings(result.warnings)
      setZipBlob(result.blob)
      setZipFilename(result.filename)
      setDownloadState('ready')

      return result
    } catch {
      setDownloadState('error')
      return null
    }
  }

  const triggerDownload = async () => {
    const result = zipBlob && zipFilename ? { blob: zipBlob, filename: zipFilename, warnings } : await generateZip()

    const finalBlob = result?.blob
    const finalName = result?.filename

    if (!finalBlob || !finalName) {
      return
    }

    const url = URL.createObjectURL(finalBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = finalName
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    a.remove()

    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  // Auto-download effect
  useEffect(() => {
    if (
      autoDownload &&
      hasSourceImage === true &&
      canDownloadPremium &&
      selectedTier === 'premium' &&
      downloadState === 'idle'
    ) {
      triggerDownload()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDownload, hasSourceImage, canDownloadPremium, selectedTier, downloadState])

  return {
    selectedTier,
    setSelectedTier,
    downloadState,
    warnings,
    zipBlob,
    zipFilename,
    triggerDownload,
    generateZip,
    canDownloadPremium,
    hasSourceImage,
  }
}

async function generateZipForTier(params: {
  selectedTier: 'free' | 'premium'
  generatedFavicons: GeneratedFavicons
  sourceImageBlob: Blob
}) {
  const { selectedTier, generatedFavicons, sourceImageBlob } = params

  if (selectedTier === 'free') {
    return generateFreeZip({
      formats: generatedFavicons.formats,
      sourceImageBlob,
    })
  }

  return generatePremiumZip({
    formats: generatedFavicons.formats,
    sourceImageBlob,
    manifest: generatedFavicons.manifest ?? '',
    browserConfig: generatedFavicons.browserConfig ?? '',
    manifestOptions: DEFAULT_MANIFEST_OPTIONS,
  })
}
