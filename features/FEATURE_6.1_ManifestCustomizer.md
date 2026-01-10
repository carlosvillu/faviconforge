# FEATURE_6.1_ManifestCustomizer.md

## 1. Natural Language Description

### What we expect to achieve
Add a manifest customization feature that allows premium users to personalize their PWA manifest.json before downloading the premium ZIP package.

### Current state (Before)
- Premium ZIP generates manifest.json with hardcoded default values:
  - `name: "My App"`
  - `shortName: "App"`
  - `themeColor: "#ffffff"`
  - `backgroundColor: "#ffffff"`
- Users cannot customize these values
- The `useDownload` hook always uses `DEFAULT_MANIFEST_OPTIONS`

### Expected end state (After)
- When a premium user selects the premium package, a customizer form appears below the PremiumPackageCard
- The form contains:
  - Text input for app name (full name)
  - Text input for short name (12 chars max recommended)
  - Native color picker for theme color
  - Native color picker for background color
- Customization is stored in component state (not persisted to storage)
- When generating the premium ZIP, the custom values are used instead of defaults
- The customizer only appears when premium package is selected AND user can download premium (logged in + premium)

---

## 2. Technical Description

### High-level approach
1. Create a `ManifestCustomizer` component with brutalist styling that displays the 4 customizable fields
2. Create a `useManifestCustomizer` hook to manage the form state with `DEFAULT_MANIFEST_OPTIONS` as initial values
3. Modify `useDownload` to accept `manifestOptions` as a parameter
4. Pass the custom options through the download flow to `generateManifest()` and the ZIP generation
5. Only show the customizer when `selectedTier === 'premium' && canDownloadPremium`

### Architecture decisions
- **No persistence**: Per PLANNING.md, customization lives in component state only
- **No regeneration**: Only the manifest.json in the ZIP uses custom values; PNG favicons are not regenerated
- **Conditional visibility**: Customizer only appears for premium users who have selected premium tier
- **Native color picker**: Uses `<input type="color">` for simplicity and zero dependencies

### Data flow
```
ManifestCustomizer (UI)
    ↓ onChange
useManifestCustomizer hook (state)
    ↓ manifestOptions
useDownload hook
    ↓ passed to generateZipForTier
generatePremiumZip()
    ↓ uses manifestOptions.themeColor/backgroundColor
generateManifest() → manifest.json in ZIP
```

---

## 2.1. Architecture Gate

- **Pages are puzzles:** `download.tsx` route module composes existing components (`DownloadSection`, `FreePackageCard`, `PremiumPackageCard`, `ManifestCustomizer`, etc.) with minimal UI logic.
- **Loaders/actions are thin:** The loader only fetches user and premium status from services, no business logic inline.
- **Business logic is not in components:**
  - State management for manifest options → `useManifestCustomizer` hook
  - ZIP generation logic → `zipGeneration.ts` service
  - Manifest generation → `faviconGeneration.ts` service
  - UI components focus only on rendering

### Route module: `app/routes/download.tsx`
- **Loader calls:** `getCurrentUser()`, `getPremiumStatus()`
- **Components composed:** `DownloadSection`, `FreePackageCard`, `PremiumPackageCard`, `ManifestCustomizer`, `DownloadActionBar`, `WarningBanner`, `PackageContentsPreview`, `BackToPreviewButton`
- **Hooks used:** `useDownload`, `useManifestCustomizer`, `useCheckout`, `useHeaderStep`

### Component: `ManifestCustomizer`
- **Hooks consumed:** None (stateless, receives props)
- **Business logic NOT inside:** Form state management (handled by parent via `useManifestCustomizer`)

### Hook: `useManifestCustomizer`
- **State:** `manifestOptions: ManifestOptions`
- **Effects:** None
- **Services called:** None (pure state management)

---

## 3. Files to Change/Create

### `app/hooks/useManifestCustomizer.ts` (NEW)

**Objective:** Manage the state of manifest customization options with validation.

**Pseudocode:**
```pseudocode
HOOK useManifestCustomizer
  STATE manifestOptions = DEFAULT_MANIFEST_OPTIONS

  FUNCTION updateOption(key: keyof ManifestOptions, value: string)
    SET manifestOptions[key] = value
  END

  FUNCTION resetToDefaults()
    SET manifestOptions = DEFAULT_MANIFEST_OPTIONS
  END

  RETURN {
    manifestOptions,
    updateOption,
    resetToDefaults,
  }
END
```

---

### `app/components/download/ManifestCustomizer.tsx` (NEW)

**Objective:** Render a brutalist-styled form for customizing manifest options. Receives values and onChange handler from parent.

**Pseudocode:**
```pseudocode
COMPONENT ManifestCustomizer
  PROPS:
    options: ManifestOptions
    onChange: (key: keyof ManifestOptions, value: string) => void

  RENDER brutalist container with border-8 border-black bg-yellow-300 p-8
    TITLE "Customize Your PWA" (uppercase, font-black)

    FORM GRID (2 columns on desktop, 1 on mobile)
      ROW 1: App Name + Short Name
        - TextInput for name (label, placeholder, value, onChange)
        - TextInput for shortName (label, placeholder, value, onChange, hint about 12 chars)

      ROW 2: Theme Color + Background Color
        - ColorPicker for themeColor (label, native input type="color", hex preview)
        - ColorPicker for backgroundColor (label, native input type="color", hex preview)
  END
END
```

**Brutalist styling requirements:**
- Container: `border-8 border-black bg-yellow-300 p-8`
- Title: `text-2xl font-black uppercase mb-6 border-b-4 border-black pb-4`
- Labels: `font-black uppercase text-sm mb-2`
- Text inputs: Use `InputBrutalist` component (exists in `app/components/ui/InputBrutalist.tsx`)
- Color inputs: `border-4 border-black h-12 w-full cursor-pointer` (native input type="color")
- Grid: `grid grid-cols-1 md:grid-cols-2 gap-6`

---

### `app/hooks/useDownload.ts` (MODIFY)

**Objective:** Accept optional `manifestOptions` parameter and pass it to ZIP generation.

**Changes:**
```pseudocode
MODIFY UseDownloadParams
  ADD manifestOptions?: ManifestOptions

MODIFY useDownload(params)
  DESTRUCTURE manifestOptions from params (default to DEFAULT_MANIFEST_OPTIONS)

MODIFY generateZipForTier
  PASS manifestOptions to generatePremiumZip when selectedTier === 'premium'

MODIFY generatePremiumZip call
  INSTEAD OF using DEFAULT_MANIFEST_OPTIONS always
  USE manifestOptions parameter
  ALSO regenerate manifest string with generateManifest(manifestOptions)
```

---

### `app/routes/download.tsx` (MODIFY)

**Objective:** Integrate ManifestCustomizer and connect it to the download flow.

**Changes:**
```pseudocode
IMPORT ManifestCustomizer from components
IMPORT useManifestCustomizer from hooks

COMPONENT DownloadPage
  EXISTING: useLoaderData, useDownload, useCheckout, etc.

  ADD: manifestCustomizer = useManifestCustomizer()

  MODIFY: Pass manifestOptions to useDownload
    useDownload({
      isPremium,
      isLoggedIn: !!user,
      autoDownload,
      manifestOptions: manifestCustomizer.manifestOptions,  // ADD THIS
    })

  RENDER:
    ... existing content ...

    <DownloadSection>
      <FreePackageCard ... />
      <PremiumPackageCard ... />
    </DownloadSection>

    // ADD: Conditional ManifestCustomizer
    IF selectedTier === 'premium' AND canDownloadPremium THEN
      <ManifestCustomizer
        options={manifestCustomizer.manifestOptions}
        onChange={manifestCustomizer.updateOption}
      />
    END

    <DownloadActionBar ... />
    ... rest of content ...
END
```

---

### `app/services/zipGeneration.ts` (MODIFY)

**Objective:** Regenerate manifest.json string using the provided manifestOptions instead of using cached manifest.

**Changes:**
```pseudocode
MODIFY generatePremiumZip(params)
  DESTRUCTURE manifestOptions from params

  // Instead of using params.manifest (which may have old defaults)
  // Generate fresh manifest with custom options
  manifest = generateManifest(manifestOptions)

  // Rest stays the same - add manifest to ZIP
  zip.file('manifest.json', manifest)
END
```

---

### `app/services/zipGeneration.types.ts` (MODIFY)

**Objective:** Update PremiumZipParams to use ManifestOptions instead of raw manifest string.

**Changes:**
```pseudocode
MODIFY PremiumZipParams
  REMOVE: manifest: string (raw JSON string)
  ADD: manifestOptions: ManifestOptions (structured options)
  KEEP: browserConfig: string (unchanged)
```

---

## 4. I18N Section

### Existing keys to reuse
None applicable - this is a new feature with unique labels.

### New keys to create

| Key | English | Spanish |
|-----|---------|---------|
| `manifest_customizer_title` | Customize Your PWA | Personaliza tu PWA |
| `manifest_app_name_label` | App Name | Nombre de la App |
| `manifest_app_name_placeholder` | My Awesome App | Mi App Increible |
| `manifest_short_name_label` | Short Name | Nombre Corto |
| `manifest_short_name_placeholder` | MyApp | MiApp |
| `manifest_short_name_hint` | Max 12 characters recommended | Max 12 caracteres recomendado |
| `manifest_theme_color_label` | Theme Color | Color del Tema |
| `manifest_background_color_label` | Background Color | Color de Fondo |
| `manifest_color_preview` | Preview | Vista previa |

---

## 5. E2E Test Plan

### Test: Premium user can customize manifest and download ZIP with custom values

**Preconditions:**
- User is logged in and has premium status
- Valid image is in sessionStorage/IndexedDB

**Steps:**
1. Navigate to `/download`
2. Select premium package (should already be selected for premium users)
3. Verify ManifestCustomizer is visible
4. Fill in custom values:
   - App Name: "Test Custom App"
   - Short Name: "TestApp"
   - Theme Color: "#ff5500"
   - Background Color: "#0055ff"
5. Click "Download Premium" button
6. Intercept the generated ZIP blob
7. Extract and parse manifest.json from ZIP

**Expected:**
- manifest.json contains:
  - `"name": "Test Custom App"`
  - `"short_name": "TestApp"`
  - `"theme_color": "#ff5500"`
  - `"background_color": "#0055ff"`

---

### Test: ManifestCustomizer is hidden for non-premium users

**Preconditions:**
- User is not logged in OR not premium
- Valid image is in sessionStorage/IndexedDB

**Steps:**
1. Navigate to `/download`
2. Select premium package

**Expected:**
- ManifestCustomizer is NOT visible
- Only "Login with Google" or "Buy Premium" CTA is shown

---

### Test: ManifestCustomizer is hidden when free tier is selected

**Preconditions:**
- User is logged in and has premium status
- Valid image is in sessionStorage/IndexedDB

**Steps:**
1. Navigate to `/download`
2. Select FREE package

**Expected:**
- ManifestCustomizer is NOT visible

---

### Test: Default values are used when no customization is made

**Preconditions:**
- User is logged in and has premium status
- Valid image is in sessionStorage/IndexedDB

**Steps:**
1. Navigate to `/download`
2. Premium package is selected
3. ManifestCustomizer is visible with default values
4. DO NOT change any values
5. Click "Download Premium" button
6. Intercept the generated ZIP blob
7. Extract and parse manifest.json from ZIP

**Expected:**
- manifest.json contains default values:
  - `"name": "My App"`
  - `"short_name": "App"`
  - `"theme_color": "#ffffff"`
  - `"background_color": "#ffffff"`

---

## 6. Definition of Done

**A task is NOT complete unless ALL of the following are green:**

1. **ALL tests pass:**
   - `npm run test:e2e -- --retries=1` - all E2E tests including new manifest customizer tests
   - `npm run test:unit` - existing unit tests still pass
2. `npm run typecheck` passes
3. `npm run lint` passes
4. All acceptance criteria:
   - [x] ManifestCustomizer component renders with brutalist styling
   - [x] Color pickers use native `<input type="color">`
   - [x] Customizer only shows for premium users with premium tier selected
   - [x] Custom values appear in downloaded ZIP's manifest.json
   - [x] Default values work when no customization is made
   - [x] i18n keys added for EN and ES

---

## 7. Implementation Notes

### Order of implementation
1. Create i18n keys first (en.json, es.json)
2. Create `useManifestCustomizer` hook
3. Create `ManifestCustomizer` component
4. Modify `zipGeneration.types.ts`
5. Modify `zipGeneration.ts`
6. Modify `useDownload.ts`
7. Modify `download.tsx` route
8. Write E2E tests
9. Run all tests and verify

### Potential edge cases
- Empty app name: Allow it (manifest spec doesn't require name)
- Invalid hex color: Native color picker always returns valid hex
- Short name > 12 chars: Show hint but allow (it's a recommendation, not a hard limit)
