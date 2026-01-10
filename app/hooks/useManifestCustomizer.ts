import { useState } from 'react'
import type { ManifestOptions } from '~/services/faviconGeneration.types'
import { DEFAULT_MANIFEST_OPTIONS } from '~/services/faviconGeneration.types'

export function useManifestCustomizer() {
  const [manifestOptions, setManifestOptions] = useState<ManifestOptions>(
    DEFAULT_MANIFEST_OPTIONS
  )

  const updateOption = (key: keyof ManifestOptions, value: string) => {
    setManifestOptions((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const resetToDefaults = () => {
    setManifestOptions(DEFAULT_MANIFEST_OPTIONS)
  }

  return {
    manifestOptions,
    updateOption,
    resetToDefaults,
  }
}
