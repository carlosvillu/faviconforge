# FEATURE_1.1_ImageValidationService.md

## 1. Natural Language Description

### Current State (Before)
El proyecto no tiene:
- Configuración de Vitest para unit testing
- Servicio de validación de imágenes
- Mensajes de error i18n para validación de imágenes
- Directorio `tests/unit/` para unit tests

### Expected State (After)
- Vitest configurado con soporte jsdom para browser APIs
- Script `npm run test:unit` disponible
- Servicio `app/services/imageValidation.ts` con funciones de validación
- Claves i18n para todos los mensajes de error de validación
- Unit tests completos en `tests/unit/imageValidation.test.ts`

### Validation Rules
1. **Formato**: PNG, JPEG, WebP, SVG (MIME types válidos)
2. **Tamaño de archivo**: Máximo 10MB
3. **Dimensiones**: Mínimo 512x512 píxeles
4. **Aspect ratio**: Exactamente 1:1 (cuadrado perfecto)

---

## 2. Technical Description

### High-Level Approach
Crear un servicio client-side de validación de imágenes que:
1. Valida el tipo MIME del archivo
2. Valida el tamaño del archivo
3. Carga la imagen para validar dimensiones y aspect ratio
4. Retorna resultados tipados con errores traducibles

### Architecture Decisions
- **Pure functions**: Cada validación es una función pura que retorna `ValidationResult`
- **Client-side only**: No requiere `.server.ts` ya que usa File API del browser
- **i18n-ready**: Errores retornan claves i18n, no strings hardcodeados
- **Composable**: Una función orquestadora combina todas las validaciones

### Dependencies
- `vitest` - Test runner
- `@vitest/coverage-v8` - Coverage reporting
- `jsdom` - Browser environment simulation for tests

---

## 2.1. Architecture Gate

- **Pages are puzzles:** N/A - Esta tarea no crea rutas
- **Loaders/actions are thin:** N/A - Esta tarea no crea loaders/actions
- **Business logic is not in components:**
  - La lógica de validación vive en `app/services/imageValidation.ts`
  - Los componentes consumirán este servicio via hooks (tarea futura 1.2)

### Service Design
- `app/services/imageValidation.ts`: Funciones puras de validación, sin side effects
- Retorna claves i18n para errores, permitiendo que el componente traduzca

---

## 3. Files to Change/Create

### `vitest.config.ts` (CREATE)
**Objective:** Configurar Vitest para unit testing con soporte jsdom

**Pseudocode:**
```pseudocode
EXPORT default config:
  test:
    environment: "jsdom"
    include: ["tests/unit/**/*.test.ts"]
    globals: true
  resolve:
    alias: "~" -> "./app"
END
```

---

### `package.json` (MODIFY)
**Objective:** Añadir dependencias de Vitest y script test:unit

**Changes:**
```pseudocode
ADD devDependencies:
  - vitest
  - @vitest/coverage-v8

ADD scripts:
  - "test:unit": "vitest run"
  - "test:unit:watch": "vitest"
END
```

---

### `app/services/imageValidation.ts` (CREATE)
**Objective:** Servicio de validación de imágenes client-side

**Types:**
```pseudocode
TYPE ValidationResult =
  | { valid: true }
  | { valid: false, errorKey: string, errorParams?: Record<string, string | number> }

TYPE ImageValidationOptions = {
  maxFileSizeBytes?: number      // default: 10 * 1024 * 1024 (10MB)
  minDimensionPx?: number        // default: 512
  allowedMimeTypes?: string[]    // default: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
}
```

**Functions:**

```pseudocode
CONSTANT ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
CONSTANT MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024
CONSTANT MIN_DIMENSION_PX = 512

FUNCTION validateImageFormat(file: File): ValidationResult
  INPUT: File object
  PROCESS:
    IF file.type NOT IN ALLOWED_MIME_TYPES
      RETURN { valid: false, errorKey: 'image_invalid_format', errorParams: { formats: 'PNG, JPEG, WebP, SVG' } }
    RETURN { valid: true }
  OUTPUT: ValidationResult
END

FUNCTION validateFileSize(file: File, maxBytes?: number): ValidationResult
  INPUT: File object, optional max bytes
  PROCESS:
    maxSize = maxBytes OR MAX_FILE_SIZE_BYTES
    IF file.size > maxSize
      sizeMB = Math.round(maxSize / 1024 / 1024)
      RETURN { valid: false, errorKey: 'image_file_too_large', errorParams: { maxSizeMB: sizeMB } }
    RETURN { valid: true }
  OUTPUT: ValidationResult
END

FUNCTION validateImageDimensions(width: number, height: number, minDimension?: number): ValidationResult
  INPUT: image width, height, optional min dimension
  PROCESS:
    minSize = minDimension OR MIN_DIMENSION_PX

    // Check minimum dimensions
    IF width < minSize OR height < minSize
      RETURN { valid: false, errorKey: 'image_too_small', errorParams: { minSize: minSize } }

    // Check aspect ratio (must be exactly 1:1)
    IF width !== height
      RETURN { valid: false, errorKey: 'image_not_square' }

    RETURN { valid: true }
  OUTPUT: ValidationResult
END

FUNCTION loadImageDimensions(file: File): Promise<{ width: number, height: number }>
  INPUT: File object
  PROCESS:
    IF file.type === 'image/svg+xml'
      // SVG: parse as text and extract viewBox or width/height
      text = await file.text()
      RETURN parseSVGDimensions(text)
    ELSE
      // Raster: use Image element
      url = URL.createObjectURL(file)
      img = new Image()
      RETURN new Promise that resolves { width: img.naturalWidth, height: img.naturalHeight }
      FINALLY: URL.revokeObjectURL(url)
  OUTPUT: Promise<{ width, height }>
END

FUNCTION parseSVGDimensions(svgText: string): { width: number, height: number }
  INPUT: SVG text content
  PROCESS:
    parser = new DOMParser()
    doc = parser.parseFromString(svgText, 'image/svg+xml')
    svg = doc.querySelector('svg')

    // Try width/height attributes first
    width = parseFloat(svg.getAttribute('width'))
    height = parseFloat(svg.getAttribute('height'))
    IF both are valid numbers
      RETURN { width, height }

    // Fallback to viewBox
    viewBox = svg.getAttribute('viewBox')
    IF viewBox
      parts = viewBox.split(/\s+/)
      RETURN { width: parseFloat(parts[2]), height: parseFloat(parts[3]) }

    // Default for SVG without dimensions (assume square)
    RETURN { width: 512, height: 512 }
  OUTPUT: { width, height }
END

FUNCTION validateImage(file: File, options?: ImageValidationOptions): Promise<ValidationResult>
  INPUT: File object, optional validation options
  PROCESS:
    // Step 1: Validate format
    formatResult = validateImageFormat(file)
    IF NOT formatResult.valid
      RETURN formatResult

    // Step 2: Validate file size
    sizeResult = validateFileSize(file, options?.maxFileSizeBytes)
    IF NOT sizeResult.valid
      RETURN sizeResult

    // Step 3: Load and validate dimensions
    TRY
      dimensions = await loadImageDimensions(file)
      dimensionResult = validateImageDimensions(dimensions.width, dimensions.height, options?.minDimensionPx)
      IF NOT dimensionResult.valid
        RETURN dimensionResult
    CATCH error
      RETURN { valid: false, errorKey: 'image_load_error' }

    RETURN { valid: true }
  OUTPUT: Promise<ValidationResult>
END
```

**Exports:**
- `validateImageFormat`
- `validateFileSize`
- `validateImageDimensions`
- `loadImageDimensions`
- `validateImage` (main orchestrator)
- `ValidationResult` type
- Constants: `ALLOWED_MIME_TYPES`, `MAX_FILE_SIZE_BYTES`, `MIN_DIMENSION_PX`

---

### `app/locales/en.json` (MODIFY)
**Objective:** Add English i18n keys for image validation errors

**New keys to add:**
```json
{
  "image_invalid_format": "Invalid image format. Allowed: {{formats}}",
  "image_file_too_large": "File is too large. Maximum size: {{maxSizeMB}}MB",
  "image_too_small": "Image is too small. Minimum size: {{minSize}}x{{minSize}} pixels",
  "image_not_square": "Image must be square (same width and height)",
  "image_load_error": "Failed to load image. Please try another file."
}
```

---

### `app/locales/es.json` (MODIFY)
**Objective:** Add Spanish i18n keys for image validation errors

**New keys to add:**
```json
{
  "image_invalid_format": "Formato de imagen no válido. Permitidos: {{formats}}",
  "image_file_too_large": "El archivo es demasiado grande. Tamaño máximo: {{maxSizeMB}}MB",
  "image_too_small": "La imagen es demasiado pequeña. Tamaño mínimo: {{minSize}}x{{minSize}} píxeles",
  "image_not_square": "La imagen debe ser cuadrada (mismo ancho y alto)",
  "image_load_error": "Error al cargar la imagen. Por favor, intenta con otro archivo."
}
```

---

### `tests/unit/imageValidation.test.ts` (CREATE)
**Objective:** Comprehensive unit tests for image validation service

**Pseudocode:**
```pseudocode
IMPORT { describe, it, expect, beforeEach, vi } from 'vitest'
IMPORT all functions from '~/services/imageValidation'

DESCRIBE 'validateImageFormat'
  IT 'accepts PNG files'
    file = new File([''], 'test.png', { type: 'image/png' })
    result = validateImageFormat(file)
    EXPECT result.valid TO BE true
  END

  IT 'accepts JPEG files'
    file = new File([''], 'test.jpg', { type: 'image/jpeg' })
    result = validateImageFormat(file)
    EXPECT result.valid TO BE true
  END

  IT 'accepts WebP files'
    file = new File([''], 'test.webp', { type: 'image/webp' })
    result = validateImageFormat(file)
    EXPECT result.valid TO BE true
  END

  IT 'accepts SVG files'
    file = new File([''], 'test.svg', { type: 'image/svg+xml' })
    result = validateImageFormat(file)
    EXPECT result.valid TO BE true
  END

  IT 'rejects GIF files'
    file = new File([''], 'test.gif', { type: 'image/gif' })
    result = validateImageFormat(file)
    EXPECT result.valid TO BE false
    EXPECT result.errorKey TO BE 'image_invalid_format'
  END

  IT 'rejects BMP files'
    file = new File([''], 'test.bmp', { type: 'image/bmp' })
    result = validateImageFormat(file)
    EXPECT result.valid TO BE false
  END

  IT 'rejects non-image files'
    file = new File([''], 'doc.pdf', { type: 'application/pdf' })
    result = validateImageFormat(file)
    EXPECT result.valid TO BE false
  END
END

DESCRIBE 'validateFileSize'
  IT 'accepts files under 10MB'
    // Create a mock file with size property
    file = new File([new ArrayBuffer(5 * 1024 * 1024)], 'test.png')
    result = validateFileSize(file)
    EXPECT result.valid TO BE true
  END

  IT 'accepts files exactly at 10MB'
    file = new File([new ArrayBuffer(10 * 1024 * 1024)], 'test.png')
    result = validateFileSize(file)
    EXPECT result.valid TO BE true
  END

  IT 'rejects files over 10MB'
    // Note: Need to mock file.size since ArrayBuffer allocation would be too large
    file = { size: 15 * 1024 * 1024, type: 'image/png' } as File
    result = validateFileSize(file)
    EXPECT result.valid TO BE false
    EXPECT result.errorKey TO BE 'image_file_too_large'
    EXPECT result.errorParams.maxSizeMB TO BE 10
  END

  IT 'respects custom max size'
    file = { size: 3 * 1024 * 1024 } as File
    result = validateFileSize(file, 2 * 1024 * 1024)
    EXPECT result.valid TO BE false
    EXPECT result.errorParams.maxSizeMB TO BE 2
  END
END

DESCRIBE 'validateImageDimensions'
  IT 'accepts 512x512 images'
    result = validateImageDimensions(512, 512)
    EXPECT result.valid TO BE true
  END

  IT 'accepts larger square images'
    result = validateImageDimensions(1024, 1024)
    EXPECT result.valid TO BE true
  END

  IT 'rejects images smaller than 512px'
    result = validateImageDimensions(256, 256)
    EXPECT result.valid TO BE false
    EXPECT result.errorKey TO BE 'image_too_small'
    EXPECT result.errorParams.minSize TO BE 512
  END

  IT 'rejects non-square images (width > height)'
    result = validateImageDimensions(1024, 512)
    EXPECT result.valid TO BE false
    EXPECT result.errorKey TO BE 'image_not_square'
  END

  IT 'rejects non-square images (height > width)'
    result = validateImageDimensions(512, 1024)
    EXPECT result.valid TO BE false
    EXPECT result.errorKey TO BE 'image_not_square'
  END

  IT 'checks minimum before aspect ratio'
    result = validateImageDimensions(256, 512)
    EXPECT result.valid TO BE false
    EXPECT result.errorKey TO BE 'image_too_small'
  END

  IT 'respects custom min dimension'
    result = validateImageDimensions(256, 256, 128)
    EXPECT result.valid TO BE true
  END
END

DESCRIBE 'parseSVGDimensions'
  IT 'extracts dimensions from width/height attributes'
    svg = '<svg width="512" height="512"></svg>'
    result = parseSVGDimensions(svg)
    EXPECT result TO EQUAL { width: 512, height: 512 }
  END

  IT 'extracts dimensions from viewBox when no width/height'
    svg = '<svg viewBox="0 0 100 100"></svg>'
    result = parseSVGDimensions(svg)
    EXPECT result TO EQUAL { width: 100, height: 100 }
  END

  IT 'prefers width/height over viewBox'
    svg = '<svg width="512" height="512" viewBox="0 0 100 100"></svg>'
    result = parseSVGDimensions(svg)
    EXPECT result TO EQUAL { width: 512, height: 512 }
  END

  IT 'handles viewBox with comma separators'
    svg = '<svg viewBox="0,0,200,200"></svg>'
    result = parseSVGDimensions(svg)
    EXPECT result TO EQUAL { width: 200, height: 200 }
  END

  IT 'defaults to 512x512 when no dimensions found'
    svg = '<svg></svg>'
    result = parseSVGDimensions(svg)
    EXPECT result TO EQUAL { width: 512, height: 512 }
  END
END

DESCRIBE 'loadImageDimensions'
  // Note: These tests require mocking Image and URL APIs

  IT 'loads raster image dimensions'
    // Mock Image, URL.createObjectURL, etc.
    // Test with a small valid PNG blob
  END

  IT 'loads SVG dimensions'
    svgContent = '<svg width="256" height="256"></svg>'
    file = new File([svgContent], 'test.svg', { type: 'image/svg+xml' })
    result = await loadImageDimensions(file)
    EXPECT result TO EQUAL { width: 256, height: 256 }
  END
END

DESCRIBE 'validateImage (integration)'
  IT 'returns valid for correct image'
    // Would need proper mocking for full integration test
  END

  IT 'fails fast on invalid format'
    file = new File([''], 'test.gif', { type: 'image/gif' })
    result = await validateImage(file)
    EXPECT result.valid TO BE false
    EXPECT result.errorKey TO BE 'image_invalid_format'
  END

  IT 'fails on oversized file before checking dimensions'
    file = { size: 15 * 1024 * 1024, type: 'image/png' } as File
    result = await validateImage(file)
    EXPECT result.valid TO BE false
    EXPECT result.errorKey TO BE 'image_file_too_large'
  END
END
```

---

## 4. I18N Section

### Existing keys to reuse
- None - this is a new feature area

### New keys to create

| Key | English | Spanish |
|-----|---------|---------|
| `image_invalid_format` | Invalid image format. Allowed: {{formats}} | Formato de imagen no válido. Permitidos: {{formats}} |
| `image_file_too_large` | File is too large. Maximum size: {{maxSizeMB}}MB | El archivo es demasiado grande. Tamaño máximo: {{maxSizeMB}}MB |
| `image_too_small` | Image is too small. Minimum size: {{minSize}}x{{minSize}} pixels | La imagen es demasiado pequeña. Tamaño mínimo: {{minSize}}x{{minSize}} píxeles |
| `image_not_square` | Image must be square (same width and height) | La imagen debe ser cuadrada (mismo ancho y alto) |
| `image_load_error` | Failed to load image. Please try another file. | Error al cargar la imagen. Por favor, intenta con otro archivo. |

---

## 5. Unit Test Plan

> Note: Since this is a client-side service, we use Vitest unit tests instead of Playwright E2E tests.

### Test: PNG format is accepted
- **Preconditions:** None
- **Steps:** Call `validateImageFormat` with File type 'image/png'
- **Expected:** Returns `{ valid: true }`

### Test: JPEG format is accepted
- **Preconditions:** None
- **Steps:** Call `validateImageFormat` with File type 'image/jpeg'
- **Expected:** Returns `{ valid: true }`

### Test: WebP format is accepted
- **Preconditions:** None
- **Steps:** Call `validateImageFormat` with File type 'image/webp'
- **Expected:** Returns `{ valid: true }`

### Test: SVG format is accepted
- **Preconditions:** None
- **Steps:** Call `validateImageFormat` with File type 'image/svg+xml'
- **Expected:** Returns `{ valid: true }`

### Test: GIF format is rejected
- **Preconditions:** None
- **Steps:** Call `validateImageFormat` with File type 'image/gif'
- **Expected:** Returns `{ valid: false, errorKey: 'image_invalid_format' }`

### Test: Files under 10MB are accepted
- **Preconditions:** None
- **Steps:** Call `validateFileSize` with 5MB file
- **Expected:** Returns `{ valid: true }`

### Test: Files over 10MB are rejected
- **Preconditions:** None
- **Steps:** Call `validateFileSize` with 15MB file
- **Expected:** Returns `{ valid: false, errorKey: 'image_file_too_large' }`

### Test: 512x512 images are accepted
- **Preconditions:** None
- **Steps:** Call `validateImageDimensions(512, 512)`
- **Expected:** Returns `{ valid: true }`

### Test: Images smaller than 512px are rejected
- **Preconditions:** None
- **Steps:** Call `validateImageDimensions(256, 256)`
- **Expected:** Returns `{ valid: false, errorKey: 'image_too_small' }`

### Test: Non-square images are rejected
- **Preconditions:** None
- **Steps:** Call `validateImageDimensions(1024, 512)`
- **Expected:** Returns `{ valid: false, errorKey: 'image_not_square' }`

### Test: SVG dimensions are parsed from width/height attributes
- **Preconditions:** None
- **Steps:** Call `parseSVGDimensions` with SVG containing width="512" height="512"
- **Expected:** Returns `{ width: 512, height: 512 }`

### Test: SVG dimensions are parsed from viewBox fallback
- **Preconditions:** None
- **Steps:** Call `parseSVGDimensions` with SVG containing only viewBox
- **Expected:** Returns correct dimensions from viewBox

### Test: Full validation fails fast on format error
- **Preconditions:** None
- **Steps:** Call `validateImage` with a GIF file
- **Expected:** Returns format error without checking size or dimensions

---

## 6. Implementation Order

1. Install Vitest dependencies (`vitest`, `@vitest/coverage-v8`)
2. Create `vitest.config.ts`
3. Add npm scripts to `package.json`
4. Create `app/services/imageValidation.ts` with all functions
5. Add i18n keys to `en.json` and `es.json`
6. Create `tests/unit/imageValidation.test.ts`
7. Run `npm run test:unit` and verify all tests pass
8. Run `npm run typecheck` and `npm run lint`

---

_Document created: 2026-01-03_
_Based on PLANNING.md Task 1.1_
