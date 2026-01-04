# FEATURE_3.1_ZIPGenerationService.md

## 1. Natural Language Description

### Current State
FaviconForge generates favicon formats (PNGs, manifest, browserconfig, HTML snippet) and displays previews. The user can see their favicon in different platform contexts, but **cannot download anything**. The generated favicons exist only in memory as Blob URLs.

### Expected End State
Users can download a complete, production-ready ZIP package:

- **Free users**: ZIP with basic formats (favicon.ico, PNG 16/32/48, snippet.html)
- **Premium users**: ZIP with ALL formats organized in folders + manifest.json + browserconfig.xml + comprehensive README.md

The ZIP generation handles:
- Client-side PNG generation (existing)
- Server-side ICO generation (via `/api/favicon/ico`)
- Graceful degradation if ICO fails (partial ZIP + warning)
- Proper folder structure for easy deployment
- Timestamped filenames to avoid conflicts

### Acceptance Criteria

1. `generateFreeZip()` returns a Blob containing:
   - `web/favicon.ico` (from API)
   - `web/favicon-16x16.png`
   - `web/favicon-32x32.png`
   - `web/favicon-48x48.png`
   - `snippet.html` (with full instructions)

2. `generatePremiumZip()` returns a Blob containing all above plus:
   - `ios/apple-touch-icon.png`
   - `android/icon-192.png`
   - `android/icon-512.png`
   - `android/maskable-icon-192.png`
   - `android/maskable-icon-512.png`
   - `windows/mstile-150x150.png`
   - `manifest.json` (at root)
   - `browserconfig.xml` (at root)
   - `README.md` (full implementation guide)

3. If ICO generation fails, ZIP is still generated with warning returned

4. All unit tests pass

---

## 2. Technical Description

### Architecture Overview

The ZIP generation is a **client-side service** that:
1. Receives generated favicon data from `useFaviconGeneration` hook
2. Fetches ICO from server via `/api/favicon/ico` endpoint
3. Assembles files into proper folder structure using JSZip
4. Returns downloadable Blob

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     useFaviconGeneration                         │
│  (already has: formats[], manifest, browserConfig, htmlSnippet) │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     zipGeneration.ts                             │
│                                                                  │
│  1. Convert Blob URLs back to Blobs                             │
│  2. Fetch ICO from /api/favicon/ico (with retry)                │
│  3. Generate snippet.html with instructions                      │
│  4. Generate README.md (premium only)                           │
│  5. Assemble ZIP with JSZip                                     │
│  6. Return { blob, warnings }                                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     useDownload hook                             │
│  (to be created in Task 3.2)                                    │
│  - Triggers download via <a download>                           │
│  - Shows warnings if any                                        │
└─────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **ICO via API**: `png-to-ico` requires Node.js (Buffer). We call the existing `/api/favicon/ico` endpoint with the source image.

2. **Graceful Degradation**: If ICO generation fails, return partial ZIP with warning. ICO is important but not blocking.

3. **No i18n in ZIP contents**: README and snippet are English-only for universal developer audience.

4. **Config files at root**: `manifest.json` and `browserconfig.xml` go at ZIP root since that's where they're typically deployed.

5. **Timestamp in filename**: `faviconforge-1704326400000.zip` prevents file conflicts.

---

## 2.1. Architecture Gate

- **Pages are puzzles:** This task creates a service only. No route modules involved.
- **Loaders/actions are thin:** N/A - pure client-side service.
- **Business logic is not in components:** ZIP generation logic in `app/services/zipGeneration.ts`.

---

## 3. Files to Change/Create

### `app/services/zipGeneration.ts`

**Objective:** Core service that generates downloadable ZIP files with all favicon formats, organized in proper folder structure.

**Pseudocode:**

```pseudocode
IMPORTS
  JSZip from 'jszip'
  types from './zipGeneration.types'

// === INTERNAL HELPERS ===

FUNCTION fetchICOFromAPI(sourceImage: string): Promise<Blob | null>
  // Convert base64/dataURL to Blob for FormData
  TRY
    response = await POST /api/favicon/ico with FormData containing file
    IF response.ok
      RETURN await response.blob()
    ELSE
      RETURN null
  CATCH
    RETURN null
  END
END

FUNCTION generateSnippetHTML(isPremium: boolean): string
  // Generate HTML with full instructions
  RETURN multiline string with:
    - Header comment explaining the file
    - "Place in <head>" instruction
    - Basic favicon links (always)
    - iOS section (premium)
    - Android/PWA section (premium)
    - Windows section (premium)
    - Closing comment with FaviconForge attribution
  END
END

FUNCTION generateREADME(): string
  // Full implementation guide for premium users
  RETURN multiline string with:
    - Title: FaviconForge Output
    - Folder structure explanation
    - Quick start (copy to public folder)
    - Detailed implementation for each platform
    - Troubleshooting section
    - Attribution
  END
END

// === PUBLIC API ===

FUNCTION generateFreeZip(params: FreeZipParams): Promise<ZipResult>
  INPUT: { formats: FaviconFormat[], sourceImage: string }

  zip = new JSZip()
  warnings = []

  // 1. Fetch ICO from API
  icoBlob = await fetchICOFromAPI(sourceImage)
  IF icoBlob
    zip.file('web/favicon.ico', icoBlob)
  ELSE
    warnings.push('ico_generation_failed')
  END

  // 2. Add PNG formats (filter only free tier: 16, 32, 48)
  FOR each format in formats WHERE tier === 'free'
    zip.file(`web/${format.name}`, format.blob)
  END

  // 3. Add snippet.html with full instructions
  snippet = generateSnippetHTML(false)
  zip.file('snippet.html', snippet)

  // 4. Generate ZIP
  blob = await zip.generateAsync({ type: 'blob' })

  RETURN { blob, warnings, filename: `faviconforge-${Date.now()}.zip` }
END

FUNCTION generatePremiumZip(params: PremiumZipParams): Promise<ZipResult>
  INPUT: { formats: FaviconFormat[], sourceImage: string, manifestOptions: ManifestOptions }

  zip = new JSZip()
  warnings = []

  // 1. Fetch ICO from API
  icoBlob = await fetchICOFromAPI(sourceImage)
  IF icoBlob
    zip.file('web/favicon.ico', icoBlob)
  ELSE
    warnings.push('ico_generation_failed')
  END

  // 2. Add ALL formats to their proper folders
  FOR each format in formats
    path = determineFilePath(format)  // web/, ios/, android/, windows/
    zip.file(path, format.blob)
  END

  // 3. Add metadata files at root
  manifest = generateManifest(manifestOptions)
  zip.file('manifest.json', manifest)

  browserConfig = generateBrowserConfig()
  zip.file('browserconfig.xml', browserConfig)

  // 4. Add snippet.html with full instructions
  snippet = generateSnippetHTML(true)
  zip.file('snippet.html', snippet)

  // 5. Add README.md
  readme = generateREADME()
  zip.file('README.md', readme)

  // 6. Generate ZIP
  blob = await zip.generateAsync({ type: 'blob' })

  RETURN { blob, warnings, filename: `faviconforge-${Date.now()}.zip` }
END

// Helper to map format to file path
FUNCTION determineFilePath(format: FaviconFormat): string
  SWITCH format.name
    CASE contains 'apple-touch' -> 'ios/' + format.name
    CASE contains 'icon-' or 'maskable' -> 'android/' + format.name
    CASE contains 'mstile' -> 'windows/' + format.name
    DEFAULT -> 'web/' + format.name
  END
END
```

---

### `app/services/zipGeneration.types.ts`

**Objective:** Type definitions for ZIP generation service.

**Pseudocode:**

```pseudocode
IMPORT FaviconFormat, ManifestOptions from faviconGeneration.types

TYPE ZipResult = {
  blob: Blob               // The ZIP file
  warnings: string[]       // Any warnings (e.g., 'ico_generation_failed')
  filename: string         // Suggested filename with timestamp
}

TYPE FreeZipParams = {
  formats: FaviconFormat[] // All generated formats (service filters to free)
  sourceImage: string      // Base64/dataURL for ICO generation
}

TYPE PremiumZipParams = FreeZipParams & {
  manifestOptions: ManifestOptions
}

EXPORT { ZipResult, FreeZipParams, PremiumZipParams }
```

---

### `tests/unit/zipGeneration.test.ts`

**Objective:** Unit tests for ZIP generation service covering all scenarios.

**Pseudocode:**

```pseudocode
IMPORTS
  vitest (describe, it, expect, vi, beforeEach)
  JSZip for extraction verification
  generateFreeZip, generatePremiumZip from zipGeneration

SETUP
  Mock global.fetch for /api/favicon/ico calls
  Create mock FaviconFormat objects with test Blobs

DESCRIBE 'generateFreeZip'

  IT 'generates ZIP with ICO and free formats'
    // Mock successful ICO fetch
    ARRANGE: mock fetch to return blob
    ARRANGE: create mock formats (16, 32, 48)

    ACT: result = await generateFreeZip({ formats, sourceImage })

    // Extract and verify
    ASSERT: result.blob is Blob
    ASSERT: result.warnings is empty
    EXTRACT zip contents
    ASSERT: contains web/favicon.ico
    ASSERT: contains web/favicon-16x16.png
    ASSERT: contains web/favicon-32x32.png
    ASSERT: contains web/favicon-48x48.png
    ASSERT: contains snippet.html
    ASSERT: NOT contains README.md
    ASSERT: NOT contains manifest.json
  END

  IT 'filters out premium formats'
    ARRANGE: include premium format (180px) in input
    ACT: result = await generateFreeZip(...)
    EXTRACT zip
    ASSERT: NOT contains apple-touch-icon.png
  END

  IT 'generates partial ZIP with warning when ICO fails'
    ARRANGE: mock fetch to return error
    ACT: result = await generateFreeZip(...)
    ASSERT: result.warnings contains 'ico_generation_failed'
    ASSERT: result.blob is Blob (still valid)
    EXTRACT zip
    ASSERT: NOT contains web/favicon.ico
    ASSERT: contains web/favicon-16x16.png
  END

  IT 'snippet.html contains free tier instructions only'
    ACT: result = await generateFreeZip(...)
    EXTRACT snippet.html content
    ASSERT: contains 'favicon.ico'
    ASSERT: NOT contains 'apple-touch-icon'
    ASSERT: NOT contains 'manifest.json'
  END

  IT 'filename includes timestamp'
    ACT: result = await generateFreeZip(...)
    ASSERT: result.filename matches /faviconforge-\d+\.zip/
  END

END

DESCRIBE 'generatePremiumZip'

  IT 'generates ZIP with all formats in correct folders'
    ARRANGE: mock formats for all tiers
    ARRANGE: mock manifestOptions

    ACT: result = await generatePremiumZip(...)

    EXTRACT zip contents
    ASSERT: contains web/favicon-*.png (3 files)
    ASSERT: contains ios/apple-touch-icon.png
    ASSERT: contains android/icon-192.png
    ASSERT: contains android/icon-512.png
    ASSERT: contains android/maskable-icon-192.png
    ASSERT: contains android/maskable-icon-512.png
    ASSERT: contains windows/mstile-150x150.png
    ASSERT: contains manifest.json (at root)
    ASSERT: contains browserconfig.xml (at root)
    ASSERT: contains snippet.html
    ASSERT: contains README.md
  END

  IT 'manifest.json contains correct options'
    ARRANGE: manifestOptions = { name: 'Test', shortName: 'T', ... }
    ACT: result = await generatePremiumZip(...)
    EXTRACT manifest.json
    PARSE JSON
    ASSERT: manifest.name === 'Test'
    ASSERT: manifest.short_name === 'T'
  END

  IT 'snippet.html contains premium sections'
    ACT: result = await generatePremiumZip(...)
    EXTRACT snippet.html
    ASSERT: contains 'apple-touch-icon'
    ASSERT: contains 'manifest.json'
    ASSERT: contains 'browserconfig.xml'
  END

  IT 'README.md contains implementation guide'
    ACT: result = await generatePremiumZip(...)
    EXTRACT README.md
    ASSERT: contains 'FaviconForge'
    ASSERT: contains 'Quick Start'
    ASSERT: contains 'Folder Structure'
  END

END

DESCRIBE 'edge cases'

  IT 'handles empty formats array gracefully'
    ACT: result = await generateFreeZip({ formats: [], sourceImage })
    ASSERT: result.blob is valid ZIP
    ASSERT: contains snippet.html
  END

  IT 'handles network timeout for ICO gracefully'
    ARRANGE: mock fetch to throw network error
    ACT: result = await generateFreeZip(...)
    ASSERT: result.warnings contains 'ico_generation_failed'
    ASSERT: result.blob is valid
  END

END
```

---

## 4. I18N Section

This task does NOT require new i18n keys. The ZIP contents (README.md, snippet.html) are English-only by design decision.

However, future Task 3.2 (download UI) will need i18n keys for:
- Download button labels
- Warning messages for partial ZIP
- Success/error toasts

---

## 5. Unit Test Plan

Since `zipGeneration.ts` is a client-side service (no `.server` suffix, no DB), tests go in `tests/unit/`.

### Test: Free ZIP contains all expected files

- **Preconditions:** Mock fetch returns valid ICO blob, mock formats array
- **Steps:** Call `generateFreeZip()` with mock data, extract ZIP
- **Expected:** ZIP contains web/favicon.ico, web/favicon-*.png, snippet.html

### Test: Free ZIP excludes premium formats

- **Preconditions:** Input includes format with tier='premium'
- **Steps:** Call `generateFreeZip()`, extract ZIP
- **Expected:** ZIP does NOT contain ios/, android/, windows/ folders

### Test: ICO failure produces partial ZIP with warning

- **Preconditions:** Mock fetch returns 500 error
- **Steps:** Call `generateFreeZip()`
- **Expected:** warnings array contains 'ico_generation_failed', ZIP still valid

### Test: Premium ZIP has correct folder structure

- **Preconditions:** All format types in input
- **Steps:** Call `generatePremiumZip()`, extract ZIP
- **Expected:** Files in web/, ios/, android/, windows/ as per spec

### Test: Premium ZIP has manifest and browserconfig at root

- **Preconditions:** manifestOptions provided
- **Steps:** Call `generatePremiumZip()`, extract ZIP
- **Expected:** manifest.json and browserconfig.xml at ZIP root (not in folders)

### Test: Premium ZIP includes README.md

- **Preconditions:** Any valid input
- **Steps:** Call `generatePremiumZip()`, extract README.md
- **Expected:** README contains "FaviconForge", "Quick Start", implementation sections

### Test: Snippet.html has correct content per tier

- **Preconditions:** N/A
- **Steps:** Extract snippet.html from free and premium ZIPs
- **Expected:** Free has basic links only, Premium has all platform sections

### Test: Filename includes timestamp

- **Preconditions:** N/A
- **Steps:** Call generateFreeZip or generatePremiumZip
- **Expected:** filename matches pattern `faviconforge-\d+\.zip`

---

## 6. Definition of Done

**A task is NOT complete unless ALL of the following are green:**

1. `npm run test:unit` passes (all tests in `tests/unit/zipGeneration.test.ts`)
2. `npm run typecheck` passes
3. `npm run lint` passes
4. All acceptance criteria from section 1 are met
5. Code follows architecture gate (logic in service, not components)

---

## Appendix: README.md Content Template

```markdown
# FaviconForge Output

Your favicon package is ready! This ZIP contains all the files you need for a production-ready favicon implementation.

## Quick Start

1. Extract this ZIP to your project's `public/` folder
2. Copy the contents of `snippet.html` to your HTML `<head>` tag
3. Done!

## Folder Structure

```
├── web/                    Basic web favicons
│   ├── favicon.ico         Multi-resolution (16, 32, 48px)
│   ├── favicon-16x16.png   Standard favicon
│   ├── favicon-32x32.png   Retina/high-DPI
│   └── favicon-48x48.png   Windows taskbar
├── ios/                    Apple devices
│   └── apple-touch-icon.png   180x180 for home screen
├── android/                Android & PWA
│   ├── icon-192.png        Standard PWA icon
│   ├── icon-512.png        Splash screen
│   ├── maskable-icon-192.png  Adaptive icon
│   └── maskable-icon-512.png  Adaptive splash
├── windows/                Windows tiles
│   └── mstile-150x150.png  Start menu tile
├── manifest.json           PWA configuration
├── browserconfig.xml       Windows tile config
├── snippet.html            Ready-to-use HTML
└── README.md               This file
```

## Implementation Details

### Basic Favicons (web/)
Place `favicon.ico` at your site root. Modern browsers also use the PNG versions.

### iOS (ios/)
The `apple-touch-icon.png` appears when users add your site to their home screen.

### Android & PWA (android/)
These icons are used for Android home screen and PWA installations. The maskable variants ensure your icon looks great in any shape container.

### Windows (windows/)
The `mstile-150x150.png` is used in Windows Start menu tiles.

### Configuration Files
- `manifest.json`: Place at site root, referenced in HTML
- `browserconfig.xml`: Place at site root, Windows will find it automatically

## Troubleshooting

**Icons not showing?**
- Clear browser cache (Ctrl+F5)
- Verify files are in correct location
- Check browser DevTools Network tab for 404 errors

**PWA not installing?**
- Ensure manifest.json is at root and accessible
- Site must be served over HTTPS
- Check Chrome DevTools > Application > Manifest for errors

---

Generated by FaviconForge
https://faviconforge.com
```

---

## Appendix: snippet.html Content Template (Premium)

```html
<!--
  FAVICONFORGE - FAVICON IMPLEMENTATION
  =====================================

  Copy everything below into your HTML <head> tag.

  Generated by FaviconForge (https://faviconforge.com)
-->

<!-- Basic Favicons -->
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="16x16" href="/web/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/web/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="48x48" href="/web/favicon-48x48.png">

<!-- iOS - Add to Home Screen -->
<link rel="apple-touch-icon" sizes="180x180" href="/ios/apple-touch-icon.png">

<!-- Android & PWA -->
<link rel="icon" type="image/png" sizes="192x192" href="/android/icon-192.png">
<link rel="icon" type="image/png" sizes="512x512" href="/android/icon-512.png">
<link rel="manifest" href="/manifest.json">

<!-- Windows Tiles -->
<meta name="msapplication-TileImage" content="/windows/mstile-150x150.png">
<meta name="msapplication-config" content="/browserconfig.xml">

<!-- Theme Color (matches your manifest) -->
<meta name="theme-color" content="#ffffff">

<!-- End FaviconForge -->
```

---

_Document created: 2025-01-04_
_Based on PRD v1.0, Task 3.1_
