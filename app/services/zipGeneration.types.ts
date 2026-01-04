import type { FaviconFormat, ManifestOptions } from './faviconGeneration.types'

export type ZipResult = {
  blob: Blob
  warnings: string[]
  filename: string
}

export type FreeZipParams = {
  formats: FaviconFormat[]
  sourceImage: string
}

export type PremiumZipParams = FreeZipParams & {
  manifestOptions: ManifestOptions
  manifest: string
  browserConfig: string
}
