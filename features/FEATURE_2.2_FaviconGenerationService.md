# FEATURE_2.2_FaviconGenerationService

## 1. Natural Language Description

**Current State:** The application can upload and validate images (Task 1.2 complete). Images are stored as base64 in sessionStorage. Dependencies `jszip` and `png-to-ico` are installed (Task 2.1 complete). However, there's no functionality to generate favicon formats from the uploaded image.

**Expected End State:** A complete favicon generation service that:
- Resizes images to all required PNG sizes using Canvas API (client-side)
- Generates maskable icons with proper safe zone padding (80% scale + background)
- Generates ICO files via a server-side API endpoint (png-to-ico works best in Node.js)
- Generates manifest.json with customizable essential fields
- Generates browserconfig.xml for Windows tiles
- Generates documented HTML snippets for easy integration
- Handles partial failures gracefully, returning what worked with warnings

**Key Design Decisions (from user clarification):**
1. **Maskable Icons**: Auto-pad to 80% with background_color from manifest options
2. **ICO Generation**: Server-side via `/api/favicon/ico` endpoint (multipart upload)
3. **Error Handling**: Partial results + warnings (return what worked)
4. **Manifest Fields**: Essential only (name, short_name, theme_color, background_color)
5. **HTML Snippet**: Documented sections, only includes tags for downloaded files

---

## 2. Technical Description

### Architecture Overview

The favicon generation system is split into two parts:

1. **Client-side Service** (`app/services/faviconGeneration.ts`)
   - Uses Canvas API for image resizing
   - Generates all PNG formats
   - Generates maskable icons with safe zone padding
   - Generates manifest.json and browserconfig.xml
   - Generates HTML snippet

2. **Server-side Service** (`app/services/ico.server.ts`)
   - Uses png-to-ico library (Node.js only)
   - Generates multi-resolution ICO files

3. **API Endpoint** (`app/routes/api.favicon.ico.tsx`)
   - POST endpoint accepting multipart form upload
   - Returns ICO blob

### Data Flow

```
sessionStorage (base64)
        │
        ▼
┌─────────────────────────────────────────────────────┐
│             Client-side (Browser)                    │
│  ┌──────────────────────────────────────────────┐   │
│  │  faviconGeneration.ts                        │   │
│  │  - loadImage() → HTMLImageElement            │   │
│  │  - resizeToCanvas() → HTMLCanvasElement      │   │
│  │  - canvasToBlob() → Blob                     │   │
│  │  - generatePNGFormats() → FaviconFormat[]    │   │
│  │  - generateMaskableIcon() → Blob             │   │
│  │  - generateManifest() → string               │   │
│  │  - generateBrowserConfig() → string          │   │
│  │  - generateHTMLSnippet() → string            │   │
│  └──────────────────────────────────────────────┘   │
│                      │                               │
│                      │ POST /api/favicon/ico         │
│                      │ (multipart with image)        │
│                      ▼                               │
└──────────────────────┼───────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │     Server-side (Node.js)    │
        │  ┌────────────────────────┐  │
        │  │  ico.server.ts         │  │
        │  │  - generateICO()       │  │
        │  │    uses png-to-ico     │  │
        │  └────────────────────────┘  │
        └──────────────────────────────┘
                       │
                       ▼
                  ICO Blob returned
```

### Format Specifications

| Format | Size | Tier | Notes |
|--------|------|------|-------|
| favicon.ico | 16, 32, 48 | Free | Multi-resolution, server-side |
| favicon-16x16.png | 16x16 | Free | |
| favicon-32x32.png | 32x32 | Free | |
| favicon-48x48.png | 48x48 | Free | |
| apple-touch-icon.png | 180x180 | Premium | |
| icon-192.png | 192x192 | Premium | PWA |
| icon-512.png | 512x512 | Premium | PWA |
| maskable-icon-192.png | 192x192 | Premium | 80% scale + bg |
| maskable-icon-512.png | 512x512 | Premium | 80% scale + bg |
| mstile-150x150.png | 150x150 | Premium | Windows |

---

## 2.1. Architecture Gate

- **Pages are puzzles:** This task creates services only, no route modules.
- **Loaders/actions are thin:** The API endpoint (`api.favicon.ico.tsx`) only parses the request and calls the service.
- **Business logic is not in components:** All generation logic in `app/services/faviconGeneration.ts` and `app/services/ico.server.ts`.

---

## 3. Files to Change/Create

### `app/services/faviconGeneration.types.ts`

**Objective:** Define all TypeScript types for the favicon generation service.

**Pseudocode:**
```pseudocode
TYPE FaviconTier = 'free' | 'premium'

TYPE FaviconFormat = {
  name: string          // e.g., "favicon-16x16.png"
  blob: Blob
  path: string          // e.g., "web/favicon-16x16.png"
  size: number          // e.g., 16
  tier: FaviconTier
}

TYPE ManifestOptions = {
  name: string              // App full name
  shortName: string         // App short name (max 12 chars recommended)
  themeColor: string        // Hex color, e.g., "#ffffff"
  backgroundColor: string   // Hex color for splash/maskable bg
}

TYPE GenerationResult =
  | { success: true, format: FaviconFormat }
  | { success: false, formatName: string, error: string }

TYPE GeneratedFavicons = {
  formats: FaviconFormat[]
  warnings: string[]        // Failed formats with reasons
  manifest: string | null   // Only for premium
  browserConfig: string | null
  htmlSnippet: string
}

TYPE FaviconGenerationOptions = {
  imageData: string         // base64 or data URL
  isPremium: boolean
  manifestOptions?: ManifestOptions
}

CONSTANTS:
  FREE_SIZES = [16, 32, 48]
  PREMIUM_SIZES = [180, 192, 512, 150]
  MASKABLE_SIZES = [192, 512]
  DEFAULT_MANIFEST_OPTIONS = {
    name: "My App",
    shortName: "App",
    themeColor: "#ffffff",
    backgroundColor: "#ffffff"
  }
```

---

### `app/services/faviconGeneration.ts`

**Objective:** Client-side service for generating all favicon formats using Canvas API.

**Pseudocode:**
```pseudocode
// ============ LOW-LEVEL UTILITIES ============

FUNCTION loadImage(dataUrl: string): Promise<HTMLImageElement>
  INPUT: base64 or data URL string
  PROCESS:
    - Create new Image()
    - Set crossOrigin = "anonymous"
    - Set src = dataUrl
    - Wait for onload or onerror
  OUTPUT: Loaded HTMLImageElement
  ERROR: Reject with "image_load_failed" if onerror

FUNCTION resizeToCanvas(img: HTMLImageElement, size: number): HTMLCanvasElement
  INPUT: Source image, target size
  PROCESS:
    - Create canvas with size x size
    - Get 2D context with imageSmoothingQuality = "high"
    - Draw image scaled to fit canvas
  OUTPUT: Canvas with resized image

FUNCTION canvasToBlob(canvas: HTMLCanvasElement, type = "image/png"): Promise<Blob>
  INPUT: Canvas element, MIME type
  PROCESS:
    - Call canvas.toBlob() with type
  OUTPUT: Blob
  ERROR: Reject if toBlob returns null

// ============ FORMAT GENERATORS ============

FUNCTION resizeImage(imageData: string, size: number): Promise<Blob>
  INPUT: Image data URL, target size
  PROCESS:
    - Load image
    - Resize to canvas
    - Convert to blob
  OUTPUT: PNG Blob
  NOTE: This is the public API function from PLANNING.md

FUNCTION generateMaskableIcon(
  imageData: string,
  size: number,
  backgroundColor: string
): Promise<Blob>
  INPUT: Image data URL, target size, background color hex
  PROCESS:
    - Create canvas with size x size
    - Fill with backgroundColor
    - Load source image
    - Calculate 80% scale (safe zone)
    - Calculate centered position: (size - scaledSize) / 2
    - Draw scaled image centered on background
  OUTPUT: PNG Blob with padded content
  NOTE: Safe zone is 80% to ensure content not clipped by OS icon masks

FUNCTION generatePNGFormats(
  imageData: string,
  isPremium: boolean
): Promise<GenerationResult[]>
  INPUT: Image data URL, premium status
  PROCESS:
    - Define sizes based on tier:
      - Free: [16, 32, 48]
      - Premium: [16, 32, 48, 180, 192, 512, 150]
    - For each size in parallel:
      - Try resizeImage(imageData, size)
      - Return success with FaviconFormat or failure with error
    - Map sizes to format names:
      - 16 → "favicon-16x16.png", path "web/"
      - 32 → "favicon-32x32.png", path "web/"
      - 48 → "favicon-48x48.png", path "web/"
      - 180 → "apple-touch-icon.png", path "ios/"
      - 192 → "icon-192.png", path "android/"
      - 512 → "icon-512.png", path "android/"
      - 150 → "mstile-150x150.png", path "windows/"
  OUTPUT: Array of GenerationResult

FUNCTION generateMaskableFormats(
  imageData: string,
  backgroundColor: string
): Promise<GenerationResult[]>
  INPUT: Image data URL, background color
  PROCESS:
    - For sizes [192, 512] in parallel:
      - Try generateMaskableIcon(imageData, size, backgroundColor)
      - Return success with FaviconFormat or failure
    - Map to format names:
      - 192 → "maskable-icon-192.png", path "android/"
      - 512 → "maskable-icon-512.png", path "android/"
  OUTPUT: Array of GenerationResult

// ============ METADATA GENERATORS ============

FUNCTION generateManifest(options: ManifestOptions): string
  INPUT: Manifest customization options
  PROCESS:
    - Create manifest object with:
      - name: options.name
      - short_name: options.shortName
      - theme_color: options.themeColor
      - background_color: options.backgroundColor
      - display: "standalone"
      - start_url: "/"
      - icons array with all PWA icon entries
  OUTPUT: JSON string (formatted with 2-space indent)

FUNCTION generateBrowserConfig(): string
  INPUT: None
  PROCESS:
    - Create XML string for Windows tile config
    - Reference mstile-150x150.png
  OUTPUT: XML string

FUNCTION generateHTMLSnippet(isPremium: boolean): string
  INPUT: Premium status
  PROCESS:
    - Build HTML comment-documented snippet
    - Group by sections: Basic Favicons, iOS, Android/PWA, Windows
    - Only include tags for files that will be in the ZIP:
      - Free: favicon.ico, favicon-16x16.png, favicon-32x32.png, favicon-48x48.png
      - Premium: All of the above plus iOS, Android, Windows, manifest, browserconfig
  OUTPUT: Formatted HTML string with section comments

// ============ MAIN ORCHESTRATOR ============

FUNCTION generateAllFormats(options: FaviconGenerationOptions): Promise<GeneratedFavicons>
  INPUT: Generation options (imageData, isPremium, manifestOptions)
  PROCESS:
    - Generate PNG formats
    - If premium: Generate maskable formats
    - Collect successful formats and warnings
    - If premium: Generate manifest and browserConfig
    - Generate HTML snippet based on tier
  OUTPUT: GeneratedFavicons with formats, warnings, metadata
  NOTE: ICO is generated separately via API call (not in this function)
```

---

### `app/services/ico.server.ts`

**Objective:** Server-side ICO generation using png-to-ico library.

**Pseudocode:**
```pseudocode
IMPORT pngToIco from "png-to-ico"
IMPORT sharp or Canvas for resizing (if needed)

FUNCTION generateICO(imageBuffer: Buffer): Promise<Buffer>
  INPUT: Original PNG image as Buffer
  PROCESS:
    - Resize image to 16x16, 32x32, 48x48 using sharp or node-canvas
    - Convert each to PNG buffer
    - Call pngToIco([png16, png32, png48])
  OUTPUT: ICO file as Buffer
  ERROR: Throw if png-to-ico fails

NOTES:
  - png-to-ico expects an array of PNG Buffers
  - We need to resize server-side since we receive original image
  - Consider using sharp for high-quality resizing
```

---

### `app/routes/api.favicon.ico.tsx`

**Objective:** API endpoint to generate ICO files from uploaded images.

**Pseudocode:**
```pseudocode
// POST /api/favicon/ico
// Content-Type: multipart/form-data
// Body: file (image/png or image/jpeg)

EXPORT ASYNC FUNCTION action({ request }: ActionFunctionArgs)
  IF request.method !== "POST"
    RETURN Response 405 Method Not Allowed

  PROCESS:
    - Parse multipart form data
    - Extract file from formData.get("file")
    - Validate file exists and is image type
    - Convert File to Buffer
    - Call generateICO(buffer)
    - Return Response with:
      - Body: ICO buffer
      - Headers:
        - Content-Type: image/x-icon
        - Content-Disposition: attachment; filename="favicon.ico"

  ERROR HANDLING:
    - Invalid file type → 400 Bad Request
    - Generation failed → 500 with error message
```

---

### Route Registration

**File:** `app/routes.ts`

**Objective:** Add the ICO API endpoint route.

**Pseudocode:**
```pseudocode
ADD route:
  route('api/favicon/ico', 'routes/api.favicon.ico.tsx')
```

---

## 4. I18N

This task primarily involves services with no direct UI. However, error messages should use i18n keys for consistency with the rest of the application.

### Existing keys to reuse
- `image_load_error` - Already exists for image loading failures

### New keys to create

| Key | English | Spanish |
|-----|---------|---------|
| `favicon_generation_failed` | Failed to generate favicon format | Error al generar formato de favicon |
| `ico_generation_failed` | Failed to generate ICO file | Error al generar archivo ICO |
| `invalid_file_upload` | Invalid file uploaded | Archivo subido no válido |
| `maskable_generation_failed` | Failed to generate maskable icon | Error al generar icono adaptable |

---

## 5. Unit Test Plan (Vitest)

File: `tests/unit/faviconGeneration.test.ts`

### Test: loadImage loads valid data URL
- **Preconditions:** Valid PNG data URL
- **Steps:** Call loadImage with data URL
- **Expected:** Returns HTMLImageElement with correct dimensions

### Test: loadImage rejects invalid data URL
- **Preconditions:** Invalid/corrupted data URL
- **Steps:** Call loadImage with bad data
- **Expected:** Rejects with error

### Test: resizeToCanvas creates correct size canvas
- **Preconditions:** Loaded image, target size 32
- **Steps:** Call resizeToCanvas(img, 32)
- **Expected:** Returns canvas with width=32, height=32

### Test: canvasToBlob returns PNG blob
- **Preconditions:** Canvas with drawn content
- **Steps:** Call canvasToBlob(canvas)
- **Expected:** Returns Blob with type "image/png"

### Test: resizeImage returns blob of correct approximate size
- **Preconditions:** Valid image data URL
- **Steps:** Call resizeImage(imageData, 16)
- **Expected:** Returns Blob (size varies but should be small PNG)

### Test: generateMaskableIcon adds padding
- **Preconditions:** Valid image data URL, size 192, bgColor "#ff0000"
- **Steps:** Call generateMaskableIcon(imageData, 192, "#ff0000")
- **Expected:** Returns Blob (need to verify visually or by pixel sampling that bg exists)

### Test: generatePNGFormats generates free formats only
- **Preconditions:** Valid image data URL, isPremium = false
- **Steps:** Call generatePNGFormats(imageData, false)
- **Expected:** Returns 3 results (16, 32, 48) with tier = "free"

### Test: generatePNGFormats generates all formats for premium
- **Preconditions:** Valid image data URL, isPremium = true
- **Steps:** Call generatePNGFormats(imageData, true)
- **Expected:** Returns 7 results including premium sizes

### Test: generateManifest creates valid JSON
- **Preconditions:** ManifestOptions with all fields
- **Steps:** Call generateManifest(options)
- **Expected:** Returns valid JSON string with correct fields

### Test: generateBrowserConfig creates valid XML
- **Preconditions:** None
- **Steps:** Call generateBrowserConfig()
- **Expected:** Returns XML string containing "mstile-150x150.png"

### Test: generateHTMLSnippet for free tier has 4 tags
- **Preconditions:** isPremium = false
- **Steps:** Call generateHTMLSnippet(false)
- **Expected:** Contains tags for ico, 16, 32, 48 only; has section comments

### Test: generateHTMLSnippet for premium has all tags
- **Preconditions:** isPremium = true
- **Steps:** Call generateHTMLSnippet(true)
- **Expected:** Contains all tags including apple-touch-icon, manifest, etc.

### Test: generateAllFormats returns partial results on failure
- **Preconditions:** Mock canvas to fail on one size
- **Steps:** Call generateAllFormats with mocked failure
- **Expected:** Returns formats that succeeded + warning for failed one

---

## 6. E2E Test Plan (Playwright)

File: `tests/e2e/ico-api.spec.ts`

### Test: POST /api/favicon/ico returns ICO file
- **Preconditions:** Valid test image file exists
- **Steps:**
  1. Read valid-512x512.png from fixtures
  2. POST to /api/favicon/ico as multipart
  3. Check response status
- **Expected:** 200 OK, Content-Type: image/x-icon, body is valid ICO

### Test: POST /api/favicon/ico rejects invalid file type
- **Preconditions:** GIF file in fixtures
- **Steps:**
  1. POST invalid-format.gif to /api/favicon/ico
- **Expected:** 400 Bad Request with error message

### Test: GET /api/favicon/ico returns 405
- **Preconditions:** None
- **Steps:** GET /api/favicon/ico
- **Expected:** 405 Method Not Allowed

---

## 7. Dependencies to Add

The ICO generation requires server-side image resizing. We need to add `sharp`:

```bash
npm install sharp
npm install -D @types/sharp
```

**Why sharp?**
- High-performance image processing for Node.js
- Excellent PNG resizing quality
- Works well with png-to-ico

---

## 8. Definition of Done

1. **ALL relevant tests pass:**
   - `npm run test:unit` - All faviconGeneration tests pass
   - `npm run test:e2e -- tests/e2e/ico-api.spec.ts --retries=1` - ICO API tests pass
2. `npm run typecheck` passes
3. `npm run lint` passes
4. All acceptance criteria met:
   - [ ] Can resize image to any size using Canvas
   - [ ] Can generate all PNG formats (free and premium)
   - [ ] Maskable icons have 80% content with background padding
   - [ ] ICO generated via server endpoint
   - [ ] manifest.json is valid JSON with customizable fields
   - [ ] browserconfig.xml is valid XML
   - [ ] HTML snippet is documented by sections
   - [ ] Partial failures return warnings, not hard errors

---

## 9. Implementation Notes

### Canvas Mocking Strategy for Tests

Since Vitest uses jsdom, Canvas operations need mocking. Recommended approach:

```typescript
// In test file
import { vi } from 'vitest'

// Mock canvas context
const mockContext = {
  drawImage: vi.fn(),
  fillRect: vi.fn(),
  // ... other methods
}

HTMLCanvasElement.prototype.getContext = vi.fn(() => mockContext)
HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
  callback(new Blob(['fake'], { type: 'image/png' }))
})
```

### Image Loading Mock

```typescript
// Mock Image class for tests
global.Image = class {
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  src = ''
  naturalWidth = 512
  naturalHeight = 512

  constructor() {
    setTimeout(() => this.onload?.(), 0)
  }
} as unknown as typeof Image
```

### Maskable Icon Visual Verification

For maskable icons, consider creating a simple test that:
1. Generates the icon
2. Checks the Blob exists and has reasonable size
3. (Optional) Use Canvas to read pixels and verify corner pixels match background color

---

_Document created: 2025-01-04_
_Based on PLANNING.md Task 2.2_
_User decisions incorporated from ultrathinker session_
