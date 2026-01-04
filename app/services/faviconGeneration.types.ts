export type FaviconTier = 'free' | 'premium'

export type FaviconFormat = {
  name: string          // e.g., "favicon-16x16.png"
  blob: Blob
  path: string          // e.g., "web/favicon-16x16.png"
  size: number          // e.g., 16
  tier: FaviconTier
}

export type ManifestOptions = {
  name: string              // App full name
  shortName: string         // App short name (max 12 chars recommended)
  themeColor: string        // Hex color, e.g., "#ffffff"
  backgroundColor: string   // Hex color for splash/maskable bg
}

export type GenerationResult =
  | { success: true; format: FaviconFormat }
  | { success: false; formatName: string; error: string }

export type GeneratedFavicons = {
  formats: FaviconFormat[]
  warnings: string[]        // Failed formats with reasons
  manifest: string | null   // Only for premium
  browserConfig: string | null
  htmlSnippet: string
}

export type FaviconGenerationOptions = {
  imageData: string         // base64 or data URL
  isPremium: boolean
  manifestOptions?: ManifestOptions
}

// Constants
export const FREE_SIZES = [16, 32, 48] as const
export const PREMIUM_SIZES = [180, 192, 512, 150] as const
export const MASKABLE_SIZES = [192, 512] as const

export const DEFAULT_MANIFEST_OPTIONS: ManifestOptions = {
  name: 'My App',
  shortName: 'App',
  themeColor: '#ffffff',
  backgroundColor: '#ffffff',
}
