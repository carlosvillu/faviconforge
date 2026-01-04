# FEATURE_2.3_PreviewRouteAndComponents.md

## 1. Natural Language Description

### Current State (Before)

The user uploads an image on `/upload`, the image is validated, and stored as base64 in sessionStorage with key `faviconforge_source_image`. When clicking "Continue", the user is navigated to `/preview` - but that route doesn't exist yet. The `faviconGeneration.ts` service is fully implemented and tested, capable of generating all PNG formats, maskable icons, manifest.json, browserconfig.xml, and HTML snippets.

### Expected End State (After)

Users arrive at `/preview` and see their favicon rendered in 6 realistic context mockups:

1. **Browser Tab** - Chrome-like tab showing 16x16 favicon (FREE)
2. **iOS Home Screen** - iPhone home screen with 180x180 icon (PREMIUM)
3. **Android Home Screen** - Android launcher with 192x192 icon (PREMIUM)
4. **Windows Tile** - Windows Start menu tile with 150x150 icon (PREMIUM)
5. **Bookmark Bar** - Browser bookmark bar with 16x16 favicon (FREE)
6. **PWA Install** - Install dialog with 512x512 icon (PREMIUM)

**Generation Flow:**
- On page load, 6 skeleton cards appear immediately (brutalist style)
- `useFaviconGeneration` hook calls `generateAllFormats()` in background
- As each favicon format becomes ready, its skeleton is replaced with the real preview
- Generation is fast (<1 second via Canvas API) - no caching needed

**Premium UX:**
- Free users see ALL 6 previews
- Premium previews (iOS, Android, Windows, PWA) show the user's actual favicon with `filter: blur(4px)` + "PREMIUM" badge
- Free previews (Browser Tab, Bookmark) show the favicon without blur

**Navigation:**
- "Back" button returns to `/upload`
- "Download" button navigates to `/download` (Task 3.2)
- Info box explains what previews mean and teases premium upgrade

---

## 2. Technical Description

### Architecture Overview

This implementation follows the project's established patterns:
- **Route as puzzle:** `preview.tsx` composes components with minimal logic
- **Hook for orchestration:** `useFaviconGeneration.ts` manages generation and loading state (no caching)
- **Presentational components:** Small, focused components in `app/components/preview/`

### Key Technical Decisions

1. **Real favicon generation** - Use `generateAllFormats()` to show actual generated favicons, not mockups
2. **Skeleton loading** - Show brutalist skeleton cards while generating
3. **Progressive replacement** - Replace skeletons as formats complete
4. **No caching** - Regenerate favicons each visit (<1s via Canvas API). Blob URLs cannot be serialized.
5. **CSS blur for premium** - Use `filter: blur(4px)` for premium previews shown to free users
6. **Hardcoded app names** - Use "My Website" / "My App" as placeholder text
7. **Custom brutalist components** - Create custom Skeleton/Badge components instead of shadcn overrides (see below)

### Data Flow

```
sessionStorage.faviconforge_source_image (base64)
         │
         ▼
useFaviconGeneration() hook
         │
         └─► Calls generateAllFormats()
             ├─► generatePNGFormats() [parallel]
             └─► generateMaskableFormats() [parallel]
         │
         ▼
generatedFavicons state (Blob URLs in memory)
         │
         └─► Passed to PreviewGrid component
```

**No caching:** Blob URLs cannot be serialized. Regeneration via Canvas API is fast (<1s).

### SessionStorage Keys

| Key | Content |
|-----|---------|
| `faviconforge_source_image` | Original image as base64 data URL (existing) |

**Note:** Generated favicons are NOT cached. Blob URLs cannot be serialized meaningfully, and regeneration via Canvas API is fast (<1 second). Each visit to `/preview` regenerates favicons from the source image.

### Why Custom Components Instead of shadcn?

shadcn provides `Skeleton`, `Badge`, `Card`, and `Progress` components that could theoretically be used here. However:

| shadcn Component | Issue with Brutalist Design |
|------------------|----------------------------|
| `Skeleton` | Uses `rounded-md` by default |
| `Badge` | Uses `rounded-md`, softer colors |
| `Card` | Uses `rounded-xl`, shadows |
| `Progress` | Uses `rounded-full` |

The STYLE_GUIDE mandates **no rounded corners** for brutalist aesthetic. Rather than fighting shadcn defaults with className overrides, we create purpose-built components that natively follow our design system:

- `PreviewCardSkeleton` - Brutalist skeleton with border-8, no rounded
- `PremiumBadge` - Red bg, font-black, uppercase, no rounded
- `PreviewCard` - border-8 border-black pattern already established

This keeps the codebase coherent and avoids "shadcn + exceptions" anti-pattern.

---

## 2.1. Architecture Gate

- **Pages are puzzles:** `preview.tsx` contains NO business logic, only:
  - Loader: Checks if source image exists in sessionStorage (client-side check via hook)
  - Component: Composes `PreviewGrid`, `PreviewActions`, `PreviewInfoBox`

- **Loaders/actions are thin:** The loader is minimal - no auth required, no DB access

- **Business logic is not in components:**
  - Domain logic (favicon generation) → `app/services/faviconGeneration.ts` (exists)
  - Caching logic → `app/hooks/useFaviconGeneration.ts` (new)
  - UI orchestration → `app/hooks/useFaviconGeneration.ts`
  - Components → Pure rendering + wiring hooks

### Route Module Breakdown

| File | Services Called | Components Composed |
|------|----------------|---------------------|
| `preview.tsx` | None (client-side only) | `PreviewGrid`, `PreviewActions`, `PreviewInfoBox`, `UploadProgressBar` |

### Component Breakdown

| Component | Hooks Used | Business Logic |
|-----------|------------|----------------|
| `PreviewGrid` | `useFaviconGeneration` | None - receives data via props |
| `PreviewCard` | None | None - pure presentational wrapper |
| `PreviewCardSkeleton` | None | None - pure presentational |
| `BrowserTabPreview` | None | None - receives faviconUrl prop |
| `IOSHomePreview` | None | None - receives faviconUrl prop |
| `AndroidHomePreview` | None | None - receives faviconUrl prop |
| `WindowsTilePreview` | None | None - receives faviconUrl prop |
| `BookmarkPreview` | None | None - receives faviconUrl prop |
| `PWAInstallPreview` | None | None - receives faviconUrl prop |
| `PremiumBadge` | None | None - pure presentational |
| `PreviewActions` | None | None - receives handlers via props |
| `PreviewInfoBox` | None | None - pure presentational |

---

## 3. Files to Change/Create

### `app/routes.ts`

**Objective:** Register the `/preview` route.

**Pseudocode:**
```pseudocode
// Add to existing routes array
route('preview', 'routes/preview.tsx')
```

---

### `app/routes/preview.tsx`

**Objective:** Page component that composes preview UI. Minimal logic - just composition.

**Pseudocode:**
```pseudocode
LOADER:
  // No server-side logic needed - all client-side
  RETURN { user: null, session: null } // Future: auth status for premium check

COMPONENT PreviewPage:
  USE useTranslation for i18n
  USE useHeaderStep to set step 2/3
  USE useFaviconGeneration to get generation state and favicons

  EFFECT on mount:
    setStep({ current: 2, total: 3, label: 'PREVIEW' })
    RETURN cleanup: setStep(null)

  IF no source image in hook state:
    REDIRECT to /upload

  RENDER:
    - UploadProgressBar(progress=66)
    - Page title (brutalist style)
    - PreviewGrid(favicons, isGenerating)
    - PreviewActions(onBack, onDownload)
    - PreviewInfoBox
```

---

### `app/hooks/useFaviconGeneration.ts`

**Objective:** Orchestrate favicon generation and manage loading state. No caching (regeneration is fast).

**Pseudocode:**
```pseudocode
TYPES:
  GenerationState = 'idle' | 'generating' | 'complete' | 'error'

  GeneratedFormat = {
    name: string,
    tier: 'free' | 'premium',
    size: number,
    blobUrl: string  // Object URL (memory only, not persisted)
  }

HOOK useFaviconGeneration():
  STATE generationState: GenerationState = 'idle'
  STATE formats: GeneratedFormat[] = []
  STATE error: string | null = null
  STATE sourceImage: string | null = null

  FUNCTION getSourceImage():
    IF typeof window === 'undefined': RETURN null
    RETURN sessionStorage.getItem('faviconforge_source_image')

  FUNCTION generateFavicons():
    source = getSourceImage()
    IF !source:
      setError('no_source_image')
      RETURN

    setSourceImage(source)
    setGenerationState('generating')

    TRY:
      result = AWAIT generateAllFormats({
        imageData: source,
        isPremium: false,  // Generate free tier (premium icons come from same sizes)
      })

      // Convert blobs to object URLs
      formatsWithUrls = result.formats.map(format => ({
        name: format.name,
        tier: format.tier,
        size: format.size,
        blobUrl: URL.createObjectURL(format.blob)
      }))

      setFormats(formatsWithUrls)
      setGenerationState('complete')

    CATCH err:
      setError(err.message)
      setGenerationState('error')

  EFFECT on mount:
    generateFavicons()

    RETURN cleanup:
      // Revoke object URLs to prevent memory leaks
      FOR format IN formats:
        URL.revokeObjectURL(format.blobUrl)

  FUNCTION getFaviconUrl(targetSize: number): string | null
    format = formats.find(f => f.size === targetSize)
    RETURN format?.blobUrl ?? null

  FUNCTION retry():
    setFormats([])
    setError(null)
    generateFavicons()

  RETURN {
    generationState,
    formats,
    error,
    sourceImage,
    getFaviconUrl,
    retry,
    hasSourceImage: !!getSourceImage()
  }
```

---

### `app/components/preview/index.ts`

**Objective:** Barrel export for preview components.

**Pseudocode:**
```pseudocode
EXPORT * from './PreviewGrid'
EXPORT * from './PreviewCard'
EXPORT * from './PreviewCardSkeleton'
EXPORT * from './BrowserTabPreview'
EXPORT * from './IOSHomePreview'
EXPORT * from './AndroidHomePreview'
EXPORT * from './WindowsTilePreview'
EXPORT * from './BookmarkPreview'
EXPORT * from './PWAInstallPreview'
EXPORT * from './PremiumBadge'
EXPORT * from './PreviewActions'
EXPORT * from './PreviewInfoBox'
```

---

### `app/components/preview/PreviewGrid.tsx`

**Objective:** Grid container that renders all 6 preview cards with skeleton fallback.

**Pseudocode:**
```pseudocode
PROPS:
  generationState: GenerationState
  getFaviconUrl: (size: number) => string | null
  sourceImage: string | null  // For blur effect on premium

COMPONENT PreviewGrid:
  RENDER grid with 6 cards:
    1. BrowserTabPreview (size 16, free)
    2. IOSHomePreview (size 180, premium)
    3. AndroidHomePreview (size 192, premium)
    4. WindowsTilePreview (size 150, premium)
    5. BookmarkPreview (size 16, free)
    6. PWAInstallPreview (size 512, premium)

  FOR each preview:
    faviconUrl = getFaviconUrl(requiredSize)
    IF generationState === 'generating' AND !faviconUrl:
      RENDER PreviewCardSkeleton
    ELSE:
      RENDER appropriate PreviewComponent with faviconUrl
      IF tier === 'premium':
        Apply blur class
        Show PremiumBadge

  CLASSES: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8
```

---

### `app/components/preview/PreviewCard.tsx`

**Objective:** Wrapper component for consistent card styling.

**Pseudocode:**
```pseudocode
PROPS:
  title: string
  description: string
  isPremium: boolean
  isBlurred: boolean
  backgroundColor: 'yellow' | 'white' (alternating)
  children: ReactNode

COMPONENT PreviewCard:
  baseClasses = "border-8 border-black p-6"
  bgClass = backgroundColor === 'yellow' ? 'bg-yellow-300' : 'bg-white'

  RENDER:
    <div className={baseClasses + bgClass}>
      <h3 className="text-xl font-black uppercase mb-4 border-b-4 border-black pb-2">
        {title}
      </h3>
      <div className={isBlurred ? 'blur-sm' : ''}>
        {children}
      </div>
      <p className="text-sm font-bold mt-3">{description}</p>
      IF isPremium:
        <PremiumBadge />
    </div>
```

---

### `app/components/preview/PreviewCardSkeleton.tsx`

**Objective:** Loading skeleton for preview cards (brutalist style).

**Pseudocode:**
```pseudocode
PROPS:
  backgroundColor: 'yellow' | 'white'

COMPONENT PreviewCardSkeleton:
  bgClass = backgroundColor === 'yellow' ? 'bg-yellow-300' : 'bg-white'

  RENDER:
    <div className="border-8 border-black p-6 {bgClass} animate-pulse">
      <div className="h-6 bg-black/20 mb-4 w-32" />  // Title placeholder
      <div className="h-32 bg-black/10 border-4 border-black/20" />  // Content placeholder
      <div className="h-4 bg-black/20 mt-3 w-24" />  // Description placeholder
    </div>
```

---

### `app/components/preview/BrowserTabPreview.tsx`

**Objective:** Chrome-like browser tab mockup showing 16x16 favicon.

**Pseudocode:**
```pseudocode
PROPS:
  faviconUrl: string | null

COMPONENT BrowserTabPreview:
  RENDER:
    <div className="bg-white border-4 border-black p-4">
      <div className="flex items-center gap-3 bg-gray-100 border-2 border-gray-400 px-3 py-2">
        IF faviconUrl:
          <img src={faviconUrl} className="w-4 h-4" alt="favicon" />
        ELSE:
          <div className="w-4 h-4 bg-black" />
        <span className="text-sm font-bold">My Website</span>
        <span className="ml-auto text-xs font-bold text-gray-500">x</span>
      </div>
    </div>
```

---

### `app/components/preview/IOSHomePreview.tsx`

**Objective:** iOS home screen mockup showing 180x180 apple-touch-icon.

**Pseudocode:**
```pseudocode
PROPS:
  faviconUrl: string | null
  isBlurred: boolean

COMPONENT IOSHomePreview:
  blurClass = isBlurred ? 'filter blur-[4px]' : ''

  RENDER:
    <div className="bg-gradient-to-br from-blue-400 to-purple-500 border-4 border-black p-8">
      <div className="space-y-4">
        <div className="flex gap-4">
          // User's app icon (first position)
          <div className={`w-16 h-16 border-4 border-white rounded-2xl overflow-hidden ${blurClass}`}>
            IF faviconUrl:
              <img src={faviconUrl} className="w-full h-full object-cover" alt="iOS icon" />
            ELSE:
              <div className="w-full h-full bg-black" />
          </div>
          // Placeholder icons
          <div className="w-16 h-16 bg-gray-300 border-4 border-white rounded-2xl" />
        </div>
        <div className="flex gap-4">
          <div className="w-16 h-16 bg-gray-300 border-4 border-white rounded-2xl" />
          <div className="w-16 h-16 bg-gray-300 border-4 border-white rounded-2xl" />
        </div>
      </div>
    </div>
```

---

### `app/components/preview/AndroidHomePreview.tsx`

**Objective:** Android launcher mockup showing 192x192 icon.

**Pseudocode:**
```pseudocode
PROPS:
  faviconUrl: string | null
  isBlurred: boolean

COMPONENT AndroidHomePreview:
  blurClass = isBlurred ? 'filter blur-[4px]' : ''

  RENDER:
    <div className="bg-gradient-to-br from-green-400 to-teal-500 border-4 border-black p-8">
      <div className="space-y-4">
        <div className="flex gap-4 justify-center">
          <div className={`w-16 h-16 border-4 border-white rounded-2xl overflow-hidden ${blurClass}`}>
            IF faviconUrl:
              <img src={faviconUrl} className="w-full h-full object-cover" alt="Android icon" />
            ELSE:
              <div className="w-full h-full bg-black" />
          </div>
          <div className="w-16 h-16 bg-gray-300 border-4 border-white rounded-2xl" />
        </div>
        <div className="flex gap-4 justify-center">
          <div className="w-16 h-16 bg-gray-300 border-4 border-white rounded-2xl" />
          <div className="w-16 h-16 bg-gray-300 border-4 border-white rounded-2xl" />
        </div>
      </div>
    </div>
```

---

### `app/components/preview/WindowsTilePreview.tsx`

**Objective:** Windows Start menu tile mockup showing 150x150 mstile.

**Pseudocode:**
```pseudocode
PROPS:
  faviconUrl: string | null
  isBlurred: boolean

COMPONENT WindowsTilePreview:
  blurClass = isBlurred ? 'filter blur-[4px]' : ''

  RENDER:
    <div className="bg-blue-600 border-4 border-black p-8">
      <div className="grid grid-cols-2 gap-2">
        <div className={`border-2 border-white h-20 overflow-hidden ${blurClass}`}>
          IF faviconUrl:
            <img src={faviconUrl} className="w-full h-full object-cover" alt="Windows tile" />
          ELSE:
            <div className="w-full h-full bg-black" />
        </div>
        <div className="bg-gray-300 border-2 border-white h-20" />
        <div className="bg-gray-300 border-2 border-white h-20" />
        <div className="bg-gray-300 border-2 border-white h-20" />
      </div>
    </div>
```

---

### `app/components/preview/BookmarkPreview.tsx`

**Objective:** Browser bookmark bar mockup showing 16x16 favicon.

**Pseudocode:**
```pseudocode
PROPS:
  faviconUrl: string | null

COMPONENT BookmarkPreview:
  RENDER:
    <div className="bg-gray-200 border-4 border-black p-4">
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1 bg-white border-2 border-gray-400 px-2 py-1">
          IF faviconUrl:
            <img src={faviconUrl} className="w-3 h-3" alt="bookmark favicon" />
          ELSE:
            <div className="w-3 h-3 bg-black" />
          <span className="text-xs font-bold">My Site</span>
        </div>
        <div className="flex items-center gap-1 bg-white border-2 border-gray-400 px-2 py-1">
          <div className="w-3 h-3 bg-gray-400" />
          <span className="text-xs font-bold">GitHub</span>
        </div>
      </div>
    </div>
```

---

### `app/components/preview/PWAInstallPreview.tsx`

**Objective:** PWA install dialog mockup showing 512x512 icon.

**Pseudocode:**
```pseudocode
PROPS:
  faviconUrl: string | null
  isBlurred: boolean

COMPONENT PWAInstallPreview:
  blurClass = isBlurred ? 'filter blur-[4px]' : ''

  RENDER:
    <div className="bg-gradient-to-b from-yellow-300 to-white border-4 border-black p-8 flex items-center justify-center">
      <div className="text-center">
        <div className={`w-24 h-24 border-4 border-black mx-auto mb-4 overflow-hidden ${blurClass}`}>
          IF faviconUrl:
            <img src={faviconUrl} className="w-full h-full object-cover" alt="PWA icon" />
          ELSE:
            <div className="w-full h-full bg-black" />
        </div>
        <div className="text-sm font-black">My App</div>
        <div className="text-xs font-bold text-gray-600 mt-1">Install</div>
      </div>
    </div>
```

---

### `app/components/preview/PremiumBadge.tsx`

**Objective:** Reusable PREMIUM badge component.

**Pseudocode:**
```pseudocode
COMPONENT PremiumBadge:
  USE useTranslation for i18n

  RENDER:
    <span className="inline-block bg-red-600 text-white px-3 py-1 text-xs font-black uppercase mt-2">
      {t('preview_premium_badge')}
    </span>
```

---

### `app/components/preview/PreviewActions.tsx`

**Objective:** Back and Download buttons.

**Pseudocode:**
```pseudocode
PROPS:
  onBack: () => void
  onDownload: () => void

COMPONENT PreviewActions:
  USE useTranslation for i18n

  RENDER:
    <div className="mt-16 flex gap-6 justify-center">
      <button
        onClick={onBack}
        className="bg-white text-black px-8 py-4 font-black uppercase text-lg border-4 border-black hover:bg-yellow-300 transition-colors"
      >
        {t('preview_back')}
      </button>
      <button
        onClick={onDownload}
        className="bg-black text-yellow-300 px-12 py-4 font-black uppercase text-lg border-4 border-black hover:bg-yellow-300 hover:text-black transition-colors"
      >
        {t('preview_download')}
      </button>
    </div>
```

---

### `app/components/preview/PreviewInfoBox.tsx`

**Objective:** Info callout explaining previews and teasing premium.

**Pseudocode:**
```pseudocode
COMPONENT PreviewInfoBox:
  USE useTranslation for i18n

  RENDER:
    <div className="mt-12 border-8 border-black p-8 bg-yellow-300">
      <div className="flex items-start gap-4">
        <div className="text-4xl">lightbulb emoji</div>
        <div>
          <h3 className="text-2xl font-black uppercase mb-2">
            {t('preview_info_title')}
          </h3>
          <p className="font-bold text-lg">
            {t('preview_info_description')}
          </p>
        </div>
      </div>
    </div>
```

---

## 4. I18N Section

### Existing keys to reuse

None directly - preview is a new section.

### New keys to create

| Key | English | Spanish |
|-----|---------|---------|
| `preview_title_line1` | Preview Your | Vista Previa de Tus |
| `preview_title_line2` | Favicons | Favicons |
| `preview_subtitle` | See how your favicon looks across different platforms and contexts. | Ve como se ve tu favicon en diferentes plataformas y contextos. |
| `preview_browser_tab` | Browser Tab | Pestana del Navegador |
| `preview_browser_tab_desc` | 16x16px favicon.ico | 16x16px favicon.ico |
| `preview_ios_home` | iOS Home Screen | Pantalla de Inicio iOS |
| `preview_ios_home_desc` | 180x180px apple-touch-icon | 180x180px apple-touch-icon |
| `preview_android` | Android | Android |
| `preview_android_desc` | 192x192px PWA icon | 192x192px icono PWA |
| `preview_windows_tile` | Windows Tile | Tile de Windows |
| `preview_windows_tile_desc` | 150x150px mstile | 150x150px mstile |
| `preview_bookmark` | Bookmark Bar | Barra de Marcadores |
| `preview_bookmark_desc` | 16x16px favicon | 16x16px favicon |
| `preview_pwa_install` | PWA Install | Instalacion PWA |
| `preview_pwa_install_desc` | 512x512px maskable | 512x512px maskable |
| `preview_premium_badge` | PREMIUM | PREMIUM |
| `preview_back` | Back | Atras |
| `preview_download` | Download | Descargar |
| `preview_info_title` | Looks Good? | Se Ve Bien? |
| `preview_info_description` | These previews show how your favicon will appear across different platforms. Free tier includes basic formats. Upgrade to Premium for all platforms! | Estas vistas previas muestran como se vera tu favicon en diferentes plataformas. El tier gratuito incluye formatos basicos. Mejora a Premium para todas las plataformas! |
| `preview_generating` | Generating favicons... | Generando favicons... |
| `preview_error` | Error generating favicons. Please try again. | Error al generar favicons. Por favor, intentalo de nuevo. |
| `preview_retry` | Retry | Reintentar |
| `preview_no_image` | No image found. Please upload an image first. | No se encontro imagen. Por favor, sube una imagen primero. |

---

## 5. E2E Test Plan

Tests will be in `tests/e2e/preview.spec.ts`. The favicon generation service is client-side, so we test the full flow via E2E.

### Test: Navigate to /preview without image redirects to /upload

- **Preconditions:** SessionStorage is empty (no source image)
- **Steps:**
  1. Navigate directly to `/preview`
  2. Wait for navigation
- **Expected:** User is redirected to `/upload`

### Test: Navigate to /preview with valid image shows skeletons then previews

- **Preconditions:** Valid 512x512 test image
- **Steps:**
  1. Upload valid image on `/upload`
  2. Click Continue
  3. Wait for `/preview` route
  4. Observe initial state
  5. Wait for generation to complete
- **Expected:**
  - Initially shows skeleton cards (at least 1 visible)
  - After generation, shows 6 preview cards with titles
  - "Browser Tab" and "Bookmark Bar" cards do NOT have PREMIUM badge
  - "iOS", "Android", "Windows", "PWA" cards have PREMIUM badge

### Test: Preview cards show correct favicon images

- **Preconditions:** Valid test image with distinctive colors
- **Steps:**
  1. Complete upload flow
  2. Wait for preview generation
  3. Check favicon images in previews
- **Expected:**
  - Free previews (Browser Tab, Bookmark) show clear favicon
  - Premium previews (iOS, Android, Windows, PWA) show blurred favicon

### Test: Back button returns to upload page

- **Preconditions:** On /preview with generated favicons
- **Steps:**
  1. Click Back button
  2. Wait for navigation
- **Expected:** User is on `/upload` page

### Test: Download button navigates to /download

- **Preconditions:** On /preview with generated favicons
- **Steps:**
  1. Click Download button
  2. Wait for navigation
- **Expected:** User is on `/download` page (or redirected if route not yet implemented)

### Test: Returning to preview regenerates favicons (fast)

- **Preconditions:** Completed preview generation once, source image still in sessionStorage
- **Steps:**
  1. Click Back to go to /upload
  2. Click Continue to return to /preview
  3. Observe loading state
- **Expected:**
  - Skeleton cards appear briefly (<1 second)
  - Favicons regenerate and display correctly
  - Source image is preserved in sessionStorage

---

## 6. Definition of Done

A task is NOT complete unless ALL of the following are green:

1. **ALL relevant tests pass:**
   - `npm run test:e2e -- --retries=1` (preview.spec.ts tests)
   - `npm run test:unit` (existing faviconGeneration tests still pass)
   - **If any test fails, the task is NOT done**

2. `npm run typecheck` passes

3. `npm run lint` passes

4. All acceptance criteria from section 1 are met:
   - [ ] /preview route registered and accessible
   - [ ] 6 preview cards render with correct titles
   - [ ] Skeletons show during generation
   - [ ] Real favicons appear after generation
   - [ ] Premium previews have blur effect + badge
   - [ ] Free previews show clear favicon without badge
   - [ ] Back button works
   - [ ] Download button navigates to /download
   - [ ] Info box renders correctly
   - [ ] Header shows "STEP 2/3: PREVIEW"
   - [ ] Progress bar shows 66%
   - [ ] Regeneration is fast (<1 second)
   - [ ] All i18n keys added for EN and ES
   - [ ] Brutalist design matches STYLE_GUIDE.md
   - [ ] Custom components used instead of shadcn (no rounded corners)

---

## Notes

### Test Image Generation

For E2E tests, we need a valid 512x512 test image. Create a fixture:
- `tests/fixtures/images/test-favicon-512.png` - Solid color or simple pattern for testing

### Future Considerations (Out of Scope)

- ICO generation (requires server-side, covered in Task 2.2)
- Premium user detection (covered in Task 4.2)
- Download page (covered in Task 3.2)

### Component Size Guidelines

Each component file should be:
- < 50 lines for simple presentational components
- < 100 lines for composite components
- Hook can be larger due to state management logic

---

_Document created: 2025-01-04_
_Based on PLANNING.md Task 2.3 and ultrathink session_
