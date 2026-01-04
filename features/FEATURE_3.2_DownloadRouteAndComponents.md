# FEATURE_3.2_DownloadRouteAndComponents.md

## 1. Natural Language Description

### What We're Building

The Download page is the **core monetization moment** of FaviconForge. After a user uploads an image and previews their favicons, they arrive at `/download` to choose between:

- **Free Package** (€0): Basic web favicons (ICO + PNG 16/32/48) - instant download, no account needed
- **Premium Package** (€5): All formats including Apple, Android, Windows, PWA - requires Google login + payment

### Current State (Before)

- User can upload an image and see previews at `/preview`
- ZIP generation service exists (`app/services/zipGeneration.ts`) but isn't connected to UI
- Premium status helpers exist but aren't used in the download flow
- Download button on preview page navigates to `/download` (404)

### Expected State (After)

- User navigates to `/download` from preview
- Two side-by-side cards show Free vs Premium packages with contents list
- **Free users**: Click "Download Free" → ZIP downloads immediately
- **Premium users**: Premium card auto-selected → Click "Download Premium" → ZIP downloads
- **Non-logged users wanting Premium**: "Sign in with Google to buy" → redirects to login with `?redirect=/download`
- Step indicator shows "STEP 3/3: DOWNLOAD" with 100% progress bar
- Generated favicon data cached in sessionStorage to avoid regeneration

---

## 2. Technical Description

### High-Level Architecture

```
/download (route)
    │
    ├── Loader
    │   ├── Check sessionStorage has source image (client-side redirect if not)
    │   ├── Get current user (optional)
    │   └── If user → fetch premium status
    │
    └── Component (DownloadPage)
        ├── useDownload hook (orchestrates state + ZIP generation)
        ├── DownloadSection (container)
        │   ├── FreePackageCard
        │   └── PremiumPackageCard
        ├── DownloadActionBar (CTA buttons)
        └── PackageContentsPreview (tree views)
```

### Data Flow

1. **Preview → Download**: Favicon blobs are cached in sessionStorage as base64 before navigation
2. **Download page load**: Hook reads cached data, reconstructs blobs
3. **ZIP generation**: On download click, hook calls `generateFreeZip` or `generatePremiumZip`
4. **Download trigger**: Creates object URL from ZIP blob, triggers browser download

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Favicon caching | sessionStorage (base64) | Persists across navigation, ~5-10MB acceptable |
| Free download UX | Single click → immediate download | Minimal friction for free tier |
| Premium gate | Redirect to /auth/login?redirect=/download | Existing pattern, no modal complexity |
| Premium user auto-select | Yes | Better UX, they already paid |
| Error handling | Warning banner + continue | ICO can fail, don't block download |
| Manifest customization | Placeholder (default values) | Task 6.1 scope |

---

## 2.1. Architecture Gate

- **Pages are puzzles:** `/download` route composes `DownloadSection`, `FreePackageCard`, `PremiumPackageCard`, `DownloadActionBar`, `PackageContentsPreview`. Minimal inline UI.
- **Loaders/actions are thin:** Loader only gets user + premium status. No business logic.
- **Business logic is not in components:**
  - **Domain logic** → `app/services/zipGeneration.ts` (already exists), `app/services/faviconCache.ts` (new)
  - **UI orchestration** → `app/hooks/useDownload.ts` (new) - manages tier selection, ZIP generation state, download trigger
  - **Components** → Pure rendering + hook consumption

### Route Module Breakdown

**`app/routes/download.tsx`**:
- **Loader**: Calls `getCurrentUser(request)` → if user, calls `getPremiumStatus(userId)`. Returns `{ user, isPremium }`.
- **Component**: Composes `HeaderWithSteps`, `DownloadSection`, `Footer`. Uses `useDownload` hook.

### Components and Their Hooks

| Component | Hooks Used | Business Logic? |
|-----------|------------|-----------------|
| `DownloadSection` | None (composition) | No |
| `FreePackageCard` | None (props only) | No |
| `PremiumPackageCard` | None (props only) | No |
| `DownloadActionBar` | `useDownload` (via props) | No |
| `PackageContentsPreview` | None (static) | No |

---

## 3. Files to Change/Create

### `app/routes.ts`

**Objective:** Register the `/download` route.

**Pseudocode:**
```pseudocode
ADD route entry:
  route('download', 'routes/download.tsx')
POSITION: After 'preview' route
```

---

### `app/services/faviconCache.ts` (NEW)

**Objective:** Manage favicon blob caching in sessionStorage. Serialize blobs to base64 for storage, deserialize on retrieval.

**Pseudocode:**
```pseudocode
CONSTANTS:
  CACHE_KEY = 'faviconforge_favicon_cache'

TYPE CachedFavicons:
  formats: Array<{ name, base64, path, size, tier }>
  manifest: string | null
  browserConfig: string | null
  htmlSnippet: string
  sourceImage: string
  timestamp: number

FUNCTION cacheFavicons(data: GeneratedFavicons, sourceImage: string): void
  INPUT: Generated favicon data with blobs + source image
  PROCESS:
    1. For each format, convert blob to base64: await blobToBase64(blob)
    2. Create CachedFavicons object with base64 data
    3. Add timestamp for potential expiry checks
    4. sessionStorage.setItem(CACHE_KEY, JSON.stringify(cached))
  OUTPUT: void (side effect: sessionStorage updated)

FUNCTION getCachedFavicons(): CachedFavicons | null
  INPUT: none
  PROCESS:
    1. Read from sessionStorage
    2. Parse JSON
    3. Return null if not found or invalid
  OUTPUT: CachedFavicons or null

FUNCTION restoreFaviconsFromCache(): GeneratedFavicons | null
  INPUT: none
  PROCESS:
    1. Get cached data
    2. If null, return null
    3. For each format, convert base64 back to blob: base64ToBlob(base64)
    4. Reconstruct GeneratedFavicons shape
  OUTPUT: GeneratedFavicons with actual Blob objects

FUNCTION clearFaviconCache(): void
  INPUT: none
  PROCESS: sessionStorage.removeItem(CACHE_KEY)
  OUTPUT: void

HELPER blobToBase64(blob: Blob): Promise<string>
  Use FileReader.readAsDataURL

HELPER base64ToBlob(base64: string, contentType: string): Blob
  Decode base64, create Uint8Array, return new Blob
```

---

### `app/hooks/useDownload.ts` (NEW)

**Objective:** Orchestrate download page state: tier selection, ZIP generation, download trigger, error handling.

**Pseudocode:**
```pseudocode
TYPE UseDownloadParams:
  isPremium: boolean
  isLoggedIn: boolean

TYPE UseDownloadReturn:
  selectedTier: 'free' | 'premium'
  setSelectedTier: (tier) => void
  downloadState: 'idle' | 'generating' | 'ready' | 'error'
  warnings: string[]
  zipBlob: Blob | null
  zipFilename: string
  triggerDownload: () => void
  generateZip: () => Promise<void>
  canDownloadPremium: boolean
  hasSourceImage: boolean

FUNCTION useDownload(params: UseDownloadParams): UseDownloadReturn
  STATE:
    selectedTier: 'free' | 'premium' (default: isPremium ? 'premium' : 'free')
    downloadState: 'idle' | 'generating' | 'ready' | 'error'
    zipBlob: Blob | null
    zipFilename: string
    warnings: string[]

  DERIVED:
    canDownloadPremium = isLoggedIn && isPremium
    hasSourceImage = getCachedFavicons() !== null

  EFFECT on mount:
    IF isPremium THEN setSelectedTier('premium')

  FUNCTION generateZip():
    1. Set downloadState = 'generating'
    2. Get cached favicons from sessionStorage
    3. If null, set error state, return
    4. Restore blobs from cache
    5. IF selectedTier === 'free':
         Call generateFreeZip({ formats: freeFormatsOnly, sourceImage })
       ELSE:
         Call generatePremiumZip({ formats, sourceImage, manifest, browserConfig, manifestOptions: DEFAULT })
    6. Set zipBlob, zipFilename, warnings
    7. Set downloadState = 'ready'
    8. CATCH: Set downloadState = 'error'

  FUNCTION triggerDownload():
    1. If no zipBlob, call generateZip() first, wait
    2. Create object URL from zipBlob
    3. Create invisible <a> element with href=URL, download=filename
    4. Click it programmatically
    5. Revoke object URL after download starts

  RETURN { selectedTier, setSelectedTier, downloadState, warnings, ... }
```

---

### `app/routes/download.tsx` (NEW)

**Objective:** Download page route. Loader fetches user/premium status. Component composes download UI.

**Pseudocode:**
```pseudocode
LOADER:
  INPUT: request
  PROCESS:
    1. Get current user: getCurrentUser(request)
    2. If user exists:
         status = await getPremiumStatus(user.id)
         Return { user, isPremium: status.isPremium }
    3. Else:
         Return { user: null, isPremium: false }
  OUTPUT: { user: User | null, isPremium: boolean }

COMPONENT DownloadPage:
  HOOKS:
    { t } = useTranslation()
    { user, isPremium } = useLoaderData()
    navigate = useNavigate()
    download = useDownload({ isPremium, isLoggedIn: !!user })
    setStep = useHeaderStep()

  EFFECT on mount:
    setStep({ current: 3, total: 3, label: t('download_step_label') })

  EFFECT check source image:
    IF NOT download.hasSourceImage THEN navigate('/upload')

  RENDER:
    <HeaderWithSteps />
    <main>
      <PageTitle title={t('download_title')} />

      <DownloadSection>
        <FreePackageCard
          isSelected={download.selectedTier === 'free'}
          onSelect={() => download.setSelectedTier('free')}
        />
        <PremiumPackageCard
          isSelected={download.selectedTier === 'premium'}
          onSelect={() => download.setSelectedTier('premium')}
          isPremium={isPremium}
          isLoggedIn={!!user}
        />
      </DownloadSection>

      <DownloadActionBar
        selectedTier={download.selectedTier}
        downloadState={download.downloadState}
        onDownload={download.triggerDownload}
        isPremium={isPremium}
        isLoggedIn={!!user}
      />

      {download.warnings.length > 0 && (
        <WarningBanner warnings={download.warnings} />
      )}

      <PackageContentsPreview />

      <BackButton to="/preview" />
    </main>
    <Footer />
```

---

### `app/components/download/DownloadSection.tsx` (NEW)

**Objective:** Container for the two-column tier selection grid.

**Pseudocode:**
```pseudocode
COMPONENT DownloadSection:
  PROPS: children (FreePackageCard + PremiumPackageCard)

  RENDER:
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
      {children}
    </div>
```

---

### `app/components/download/FreePackageCard.tsx` (NEW)

**Objective:** Selectable card showing free package contents with price and feature list.

**Pseudocode:**
```pseudocode
COMPONENT FreePackageCard:
  PROPS:
    isSelected: boolean
    onSelect: () => void

  HOOKS:
    { t } = useTranslation()

  CONSTANTS:
    FREE_ITEMS = [
      'download_free_item_ico',
      'download_free_item_png16',
      'download_free_item_png32',
      'download_free_item_png48',
      'download_free_item_snippet'
    ]

  RENDER:
    <div
      onClick={onSelect}
      className={selectionStyles(isSelected, 'free')}
    >
      <CardHeader title={t('download_free_title')} price="€0" isSelected={isSelected} />

      <div className="border-t-4 border-black pt-6 mb-6">
        <p className="font-black text-sm uppercase mb-4">{t('download_included')}</p>
        <ul>
          {FREE_ITEMS.map(key => (
            <li className="flex gap-2 font-bold">
              <CheckIcon className="text-green-600" />
              {t(key)}
            </li>
          ))}
        </ul>
      </div>

      <ZipSizeInfo size="~15 KB" files={5} />
    </div>
```

---

### `app/components/download/PremiumPackageCard.tsx` (NEW)

**Objective:** Selectable card showing premium package. Shows different states: not logged in, logged in but not premium, premium user.

**Pseudocode:**
```pseudocode
COMPONENT PremiumPackageCard:
  PROPS:
    isSelected: boolean
    onSelect: () => void
    isPremium: boolean
    isLoggedIn: boolean

  HOOKS:
    { t } = useTranslation()

  CONSTANTS:
    PREMIUM_ITEMS = [
      'download_premium_item_all_free',
      'download_premium_item_apple',
      'download_premium_item_android',
      'download_premium_item_maskable',
      'download_premium_item_windows',
      'download_premium_item_manifest',
      'download_premium_item_browserconfig',
      'download_premium_item_readme'
    ]

  RENDER:
    <div
      onClick={onSelect}
      className={selectionStyles(isSelected, 'premium')}
    >
      <BestValueBadge />

      <CardHeader
        title={t('download_premium_title')}
        price="€5"
        subtitle={t('download_premium_lifetime')}
        isSelected={isSelected}
        variant="premium"
      />

      <div className={borderStyles(isSelected)}>
        <p className="font-black text-sm uppercase mb-4">{t('download_premium_includes')}</p>
        <ul>
          {PREMIUM_ITEMS.map(key => (
            <li className="flex gap-2 font-bold">
              <CheckIcon className={isSelected ? 'text-green-400' : 'text-green-600'} />
              {t(key)}
            </li>
          ))}
        </ul>
      </div>

      <ZipSizeInfo size="~150 KB" files="15+" variant={isSelected ? 'premium' : 'default'} />
    </div>
```

---

### `app/components/download/DownloadActionBar.tsx` (NEW)

**Objective:** Action section with dynamic CTA buttons based on tier selection and user state.

**Pseudocode:**
```pseudocode
COMPONENT DownloadActionBar:
  PROPS:
    selectedTier: 'free' | 'premium'
    downloadState: 'idle' | 'generating' | 'ready' | 'error'
    onDownload: () => void
    isPremium: boolean
    isLoggedIn: boolean

  HOOKS:
    { t } = useTranslation()

  DERIVED:
    isGenerating = downloadState === 'generating'
    showLoginButton = selectedTier === 'premium' && !isLoggedIn
    showBuyButton = selectedTier === 'premium' && isLoggedIn && !isPremium
    showPremiumDownload = selectedTier === 'premium' && isPremium
    showFreeDownload = selectedTier === 'free'

  RENDER:
    <div className="border-8 border-black p-8 bg-yellow-300">
      <div className="flex items-center justify-between gap-8">
        <div>
          <h3 className="text-3xl font-black uppercase mb-2">
            {t('download_ready_title')}
          </h3>
          <p className="font-bold text-lg">
            {selectedTier === 'free'
              ? t('download_ready_free_desc')
              : isLoggedIn && isPremium
                ? t('download_ready_premium_desc')
                : t('download_ready_login_desc')}
          </p>
        </div>

        <div className="flex gap-4">
          IF showFreeDownload:
            <DownloadButton
              onClick={onDownload}
              isLoading={isGenerating}
              label={t('download_free_cta')}
              sublabel={t('download_free_size')}
            />

          IF showLoginButton:
            <Link to="/auth/login?redirect=/download">
              <LoginButton label={t('download_login_cta')} />
            </Link>
            <DisabledBuyButton label={t('download_buy_cta')} />

          IF showBuyButton:
            <BuyPremiumButton label={t('download_buy_cta')} />
            // Note: Buy button is placeholder for Task 5.x (Stripe)

          IF showPremiumDownload:
            <DownloadButton
              onClick={onDownload}
              isLoading={isGenerating}
              label={t('download_premium_cta')}
              sublabel={t('download_premium_size')}
              variant="premium"
            />
        </div>
      </div>
    </div>
```

---

### `app/components/download/PackageContentsPreview.tsx` (NEW)

**Objective:** Two-column file tree preview showing what's in each ZIP package.

**Pseudocode:**
```pseudocode
COMPONENT PackageContentsPreview:
  HOOKS:
    { t } = useTranslation()

  RENDER:
    <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
      <FreePackageTree />
      <PremiumPackageTree />
    </div>

COMPONENT FreePackageTree:
  RENDER:
    <div className="border-8 border-black p-6 bg-white">
      <h4>{t('download_free_contents_title')}</h4>
      <FileTree structure={FREE_STRUCTURE} />
    </div>

COMPONENT PremiumPackageTree:
  RENDER:
    <div className="border-8 border-black p-6 bg-black text-yellow-300">
      <h4>{t('download_premium_contents_title')}</h4>
      <FileTree structure={PREMIUM_STRUCTURE} variant="dark" />
    </div>
```

---

### `app/components/download/WarningBanner.tsx` (NEW)

**Objective:** Display warnings from ZIP generation (e.g., ICO failed) without blocking download.

**Pseudocode:**
```pseudocode
COMPONENT WarningBanner:
  PROPS:
    warnings: string[]

  HOOKS:
    { t } = useTranslation()

  RENDER:
    <div className="border-4 border-yellow-500 bg-yellow-100 p-4 mt-4">
      <p className="font-black uppercase mb-2">{t('download_warning_title')}</p>
      <ul>
        {warnings.map(warning => (
          <li className="font-bold text-sm">
            {t(`download_warning_${warning}`)}
          </li>
        ))}
      </ul>
    </div>
```

---

### `app/hooks/useFaviconGeneration.ts` (MODIFY)

**Objective:** Add caching of generated favicons before navigation to download page.

**Pseudocode:**
```pseudocode
EXISTING CODE...

ADD after generation completes:
  FUNCTION cacheForDownload():
    IF generationState === 'complete':
      1. Get sourceImage from sessionStorage
      2. Call cacheFavicons(generatedData, sourceImage)

  EFFECT when generationState changes to 'complete':
    cacheForDownload()

RETURN:
  ...existing returns,
  cacheForDownload  // Expose for manual trigger if needed
```

---

### `app/routes/preview.tsx` (MODIFY)

**Objective:** Ensure favicons are cached before navigating to download.

**Pseudocode:**
```pseudocode
EXISTING CODE...

MODIFY Download button onClick:
  BEFORE: navigate('/download')
  AFTER:
    1. Ensure cache is populated (hook should auto-cache on complete)
    2. navigate('/download')
```

---

## 4. I18N Section

### Existing Keys to Reuse

| Key | Usage |
|-----|-------|
| `google_continue` | "Continue with Google" on login button |
| `buy_premium` | "Buy Premium" for purchase CTA |
| `premium_price` | "€5 one-time" |
| `preview_back` | "Back" button |
| `loading` | Loading states |

### New Keys to Create

| Key | English | Spanish |
|-----|---------|---------|
| `download_step_label` | DOWNLOAD | DESCARGA |
| `download_title_line1` | Choose Your | Elige Tu |
| `download_title_line2` | Package | Paquete |
| `download_subtitle` | Download your favicons in the format that suits your needs. | Descarga tus favicons en el formato que necesites. |
| `download_free_title` | Free | Gratis |
| `download_premium_title` | Premium | Premium |
| `download_premium_lifetime` | ONE-TIME * FOREVER | PAGO UNICO * PARA SIEMPRE |
| `download_best_value` | BEST VALUE | MEJOR VALOR |
| `download_included` | Included: | Incluido: |
| `download_premium_includes` | Everything in Free, plus: | Todo lo de Gratis, mas: |
| `download_free_item_ico` | favicon.ico (16, 32, 48px) | favicon.ico (16, 32, 48px) |
| `download_free_item_png16` | favicon-16x16.png | favicon-16x16.png |
| `download_free_item_png32` | favicon-32x32.png | favicon-32x32.png |
| `download_free_item_png48` | favicon-48x48.png | favicon-48x48.png |
| `download_free_item_snippet` | HTML snippet with code | Snippet HTML con codigo |
| `download_premium_item_all_free` | Everything in Free | Todo lo de Gratis |
| `download_premium_item_apple` | Apple Touch Icon (180x180) | Apple Touch Icon (180x180) |
| `download_premium_item_android` | Android Icons (192, 512px) | Iconos Android (192, 512px) |
| `download_premium_item_maskable` | Maskable Icons (192, 512px) | Iconos Maskable (192, 512px) |
| `download_premium_item_windows` | Windows Tile (150x150) | Windows Tile (150x150) |
| `download_premium_item_manifest` | manifest.json (customizable) | manifest.json (personalizable) |
| `download_premium_item_browserconfig` | browserconfig.xml | browserconfig.xml |
| `download_premium_item_readme` | Complete README documentation | Documentacion README completa |
| `download_zip_size` | ZIP SIZE: | TAMANO ZIP: |
| `download_files_count` | FILES: | ARCHIVOS: |
| `download_ready_title` | Ready to Download | Listo para Descargar |
| `download_ready_free_desc` | Your basic favicon package is ready. No account required! | Tu paquete basico esta listo. Sin cuenta requerida! |
| `download_ready_premium_desc` | Your premium package with all formats is ready! | Tu paquete premium con todos los formatos esta listo! |
| `download_ready_login_desc` | Login with Google to purchase premium access and unlock all formats. | Inicia sesion con Google para comprar premium y desbloquear todos los formatos. |
| `download_free_cta` | Download Free | Descargar Gratis |
| `download_free_size` | ZIP * ~15 KB | ZIP * ~15 KB |
| `download_premium_cta` | Download Premium | Descargar Premium |
| `download_premium_size` | ZIP * ~150 KB | ZIP * ~150 KB |
| `download_login_cta` | Login with Google | Iniciar con Google |
| `download_buy_cta` | Buy Premium | Comprar Premium |
| `download_buy_subtitle` | €5 * ONE-TIME | €5 * PAGO UNICO |
| `download_free_contents_title` | Free Package Contents | Contenido Paquete Gratis |
| `download_premium_contents_title` | Premium Package Contents | Contenido Paquete Premium |
| `download_generating` | Generating ZIP... | Generando ZIP... |
| `download_warning_title` | Warning | Advertencia |
| `download_warning_ico_generation_failed` | ICO generation failed. ZIP contains PNG files only. | Generacion de ICO fallo. El ZIP solo contiene archivos PNG. |
| `download_back_preview` | Back to Preview | Volver a Vista Previa |

---

## 5. E2E Test Plan

### Test File: `tests/e2e/download.spec.ts`

---

### Test 1: Redirect to /upload if no source image

**Preconditions:**
- sessionStorage is empty (no `faviconforge_source_image`, no `faviconforge_favicon_cache`)

**Steps:**
1. Navigate directly to `/download`

**Expected:**
- User is redirected to `/upload`
- URL is `/upload`

---

### Test 2: Anonymous user can download free ZIP

**Preconditions:**
- Valid image uploaded and cached in sessionStorage
- User is NOT logged in

**Steps:**
1. Set up sessionStorage with test image and favicon cache
2. Navigate to `/download`
3. Verify Free tier is selected by default
4. Click "Download Free" button
5. Wait for download to trigger

**Expected:**
- Free package card is visually selected (yellow background, scale)
- Download button shows "Download Free"
- ZIP file download is triggered
- ZIP filename matches pattern `faviconforge-*.zip`

---

### Test 3: Anonymous user sees login prompt for premium

**Preconditions:**
- Valid image cached in sessionStorage
- User is NOT logged in

**Steps:**
1. Navigate to `/download`
2. Click on Premium package card
3. Observe action bar buttons

**Expected:**
- Premium card becomes selected (black background)
- Action bar shows "Login with Google" button
- Action bar shows disabled "Buy Premium" button
- "Login with Google" links to `/auth/login?redirect=/download`

---

### Test 4: Premium user sees auto-selected premium tier

**Preconditions:**
- Valid image cached in sessionStorage
- User is logged in AND has premium status

**Steps:**
1. Create premium user via test endpoint
2. Login as premium user
3. Navigate to `/download`

**Expected:**
- Premium package card is auto-selected
- Action bar shows "Download Premium" button (not "Buy")
- No login prompts visible

---

### Test 5: Step indicator shows 3/3 and 100% progress

**Preconditions:**
- Valid image cached in sessionStorage

**Steps:**
1. Navigate to `/download`

**Expected:**
- Header shows "STEP 3/3: DOWNLOAD"
- Progress bar is 100% filled (yellow spans full width)

---

### Test 6: ZIP contains correct files for free tier

**Preconditions:**
- Valid image cached in sessionStorage

**Steps:**
1. Navigate to `/download`
2. Click "Download Free"
3. Intercept download and inspect ZIP contents

**Expected:**
- ZIP contains `web/` folder
- ZIP contains `favicon-16x16.png`, `favicon-32x32.png`, `favicon-48x48.png`
- ZIP contains `favicon.ico` (or warning shown if failed)
- ZIP contains `snippet.html`
- ZIP does NOT contain `ios/`, `android/`, `windows/`, `manifest.json`

---

### Test 7: Warning banner shown when ICO generation fails

**Preconditions:**
- Valid image cached (but ICO API will fail - mock or use invalid data)

**Steps:**
1. Navigate to `/download`
2. Click "Download Free"
3. Observe warning banner

**Expected:**
- Warning banner appears with message about ICO failure
- Download still completes with PNG files
- User can still get their files

---

### Test 8: Back button navigates to preview

**Preconditions:**
- Valid image cached in sessionStorage

**Steps:**
1. Navigate to `/download`
2. Click "Back to Preview" button

**Expected:**
- User is navigated to `/preview`
- Preview page loads correctly with cached data

---

## 6. Definition of Done

**A task is NOT complete unless ALL of the following are green:**

1. **All E2E tests pass:** `npm run test:e2e -- --retries=1 tests/e2e/download.spec.ts`
2. **All existing tests pass:** `npm run test:e2e -- --retries=1` (full suite)
3. **Unit tests pass:** `npm run test:unit` (if any new unit tests added)
4. **TypeScript compiles:** `npm run typecheck` passes with no errors
5. **Linting passes:** `npm run lint` passes with no errors
6. **i18n complete:** All 35+ new keys added to both `en.json` and `es.json`
7. **Manual verification:**
   - Free download works end-to-end
   - Premium tier selection works
   - Login redirect includes `?redirect=/download`
   - Step indicator shows 3/3

---

## Appendix: Component Dependency Graph

```
download.tsx (route)
├── useDownload (hook)
│   └── faviconCache.ts (service)
│       └── zipGeneration.ts (existing service)
├── DownloadSection
│   ├── FreePackageCard
│   │   └── ZipSizeInfo
│   └── PremiumPackageCard
│       ├── BestValueBadge
│       └── ZipSizeInfo
├── DownloadActionBar
│   ├── DownloadButton
│   ├── LoginButton (Link to /auth/login)
│   └── BuyPremiumButton (placeholder for Task 5.x)
├── WarningBanner
├── PackageContentsPreview
│   ├── FreePackageTree
│   └── PremiumPackageTree
└── BackButton
```

---

## Appendix: sessionStorage Keys

| Key | Type | Purpose |
|-----|------|---------|
| `faviconforge_source_image` | string (base64) | Original uploaded image |
| `faviconforge_favicon_cache` | JSON string | Cached generated favicons with metadata |

---

_Document created: 2026-01-04_
_Based on PLANNING.md Task 3.2_
_Mockup reference: mockups/DownloadPage.jsx_
