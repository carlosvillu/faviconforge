import { useMemo, useState } from 'react'
import type { GeneratedFavicons } from '~/services/faviconGeneration.types'
import {
  getCachedFavicons,
  restoreFaviconsFromCache,
} from '~/services/faviconCache'
import { generateFreeZip, generatePremiumZip } from '~/services/zipGeneration'
import { DEFAULT_MANIFEST_OPTIONS } from '~/services/faviconGeneration.types'
import type { ZipResult } from '~/services/zipGeneration.types'

type DownloadState = 'idle' | 'generating' | 'ready' | 'error'

type UseDownloadParams = {
  isPremium: boolean
  isLoggedIn: boolean
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
  hasSourceImage: boolean
}

export function useDownload(params: UseDownloadParams): UseDownloadReturn {
  const { isPremium, isLoggedIn } = params

  const [selectedTier, setSelectedTier] = useState<'free' | 'premium'>(
    isPremium ? 'premium' : 'free'
  )
  const [downloadState, setDownloadState] = useState<DownloadState>('idle')
  const [zipBlob, setZipBlob] = useState<Blob | null>(null)
  const [zipFilename, setZipFilename] = useState<string>('')
  const [warnings, setWarnings] = useState<string[]>([])

  const canDownloadPremium = isLoggedIn && isPremium

  const hasSourceImage = useMemo(() => {
    if (typeof window === 'undefined') return false
    return getCachedFavicons() !== null
  }, [])

  const generateZip = async (): Promise<ZipResult | null> => {
    try {
      setDownloadState('generating')

      const cached = getCachedFavicons()
      if (!cached) {
        setDownloadState('error')
        return null
      }

      const restored = restoreFaviconsFromCache()
      if (!restored) {
        setDownloadState('error')
        return null
      }

      const result = await generateZipForTier({
        selectedTier,
        generatedFavicons: restored,
        sourceImage: cached.sourceImage,
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
  sourceImage: string
}) {
  const { selectedTier, generatedFavicons, sourceImage } = params

  if (selectedTier === 'free') {
    return generateFreeZip({
      formats: generatedFavicons.formats,
      sourceImage,
    })
  }

  return generatePremiumZip({
    formats: generatedFavicons.formats,
    sourceImage,
    manifest: generatedFavicons.manifest ?? '',
    browserConfig: generatedFavicons.browserConfig ?? '',
    manifestOptions: DEFAULT_MANIFEST_OPTIONS,
  })
}
