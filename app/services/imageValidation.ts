export type ValidationResult =
  | { valid: true }
  | {
      valid: false
      errorKey: string
      errorParams?: Record<string, string | number>
    }

export type ImageValidationOptions = {
  maxFileSizeBytes?: number // default: 10 * 1024 * 1024 (10MB)
  minDimensionPx?: number // default: 512
  allowedMimeTypes?: string[] // default: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
}

export const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
]
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
export const MIN_DIMENSION_PX = 512

export function validateImageFormat(file: File): ValidationResult {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      errorKey: 'image_invalid_format',
      errorParams: { formats: 'PNG, JPEG, WebP, SVG' },
    }
  }
  return { valid: true }
}

export function validateFileSize(
  file: File,
  maxBytes?: number
): ValidationResult {
  const maxSize = maxBytes ?? MAX_FILE_SIZE_BYTES
  if (file.size > maxSize) {
    const sizeMB = Math.round(maxSize / 1024 / 1024)
    return {
      valid: false,
      errorKey: 'image_file_too_large',
      errorParams: { maxSizeMB: sizeMB },
    }
  }
  return { valid: true }
}

export function validateImageDimensions(
  width: number,
  height: number,
  minDimension?: number
): ValidationResult {
  const minSize = minDimension ?? MIN_DIMENSION_PX

  // Check minimum dimensions
  if (width < minSize || height < minSize) {
    return {
      valid: false,
      errorKey: 'image_too_small',
      errorParams: { minSize },
    }
  }

  // Check aspect ratio (must be exactly 1:1)
  if (width !== height) {
    return {
      valid: false,
      errorKey: 'image_not_square',
    }
  }

  return { valid: true }
}

export function parseSVGDimensions(svgText: string): {
  width: number
  height: number
} {
  const parser = new DOMParser()
  const doc = parser.parseFromString(svgText, 'image/svg+xml')
  const svg = doc.querySelector('svg')

  if (!svg) {
    return { width: 512, height: 512 }
  }

  // Try width/height attributes first
  const widthAttr = svg.getAttribute('width')
  const heightAttr = svg.getAttribute('height')
  const width = widthAttr ? parseFloat(widthAttr) : NaN
  const height = heightAttr ? parseFloat(heightAttr) : NaN

  if (!isNaN(width) && !isNaN(height)) {
    return { width, height }
  }

  // Fallback to viewBox
  const viewBox = svg.getAttribute('viewBox')
  if (viewBox) {
    const parts = viewBox.split(/[\s,]+/)
    if (parts.length >= 4) {
      return {
        width: parseFloat(parts[2]),
        height: parseFloat(parts[3]),
      }
    }
  }

  // Default for SVG without dimensions (assume square)
  return { width: 512, height: 512 }
}

export async function loadImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  if (file.type === 'image/svg+xml') {
    // SVG: parse as text and extract viewBox or width/height
    const text = await file.text()
    return parseSVGDimensions(text)
  } else {
    // Raster: use Image element
    const url = URL.createObjectURL(file)
    try {
      return await new Promise<{ width: number; height: number }>(
        (resolve, reject) => {
          const img = new Image()
          img.onload = () => {
            resolve({
              width: img.naturalWidth,
              height: img.naturalHeight,
            })
          }
          img.onerror = () => {
            reject(new Error('Failed to load image'))
          }
          img.src = url
        }
      )
    } finally {
      URL.revokeObjectURL(url)
    }
  }
}

export async function validateImage(
  file: File,
  options?: ImageValidationOptions
): Promise<ValidationResult> {
  // Step 1: Validate format
  const formatResult = validateImageFormat(file)
  if (!formatResult.valid) {
    return formatResult
  }

  // Step 2: Validate file size
  const sizeResult = validateFileSize(file, options?.maxFileSizeBytes)
  if (!sizeResult.valid) {
    return sizeResult
  }

  // Step 3: Load and validate dimensions
  try {
    const dimensions = await loadImageDimensions(file)
    const dimensionResult = validateImageDimensions(
      dimensions.width,
      dimensions.height,
      options?.minDimensionPx
    )
    if (!dimensionResult.valid) {
      return dimensionResult
    }
  } catch {
    return {
      valid: false,
      errorKey: 'image_load_error',
    }
  }

  return { valid: true }
}
