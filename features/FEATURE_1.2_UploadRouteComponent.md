# FEATURE_1.2_UploadRouteComponent.md

## 1. Natural Language Description

### Current State

The project has:
- An image validation service (`app/services/imageValidation.ts`)
- A Header component with minimalist styling
- A Footer component with minimalist styling
- shadcn/ui components: Button, Card, Dialog, Input, etc.
- No upload functionality

### Expected End State

After this task:
- Header updated to brutalist style (yellow bg, thick borders, font-black)
- Footer updated to brutalist style (black bg, yellow text)
- `/upload` route with drag-and-drop image upload
- Step indicator support in Header (optional prop)
- Progress bar component for wizard flow
- All UI follows STYLE_GUIDE.md brutalist design
- All text internationalized (EN/ES)

### Acceptance Criteria

1. Header uses brutalist styling across all pages
2. Footer uses brutalist styling across all pages
3. `/upload` route accessible without authentication
4. Header shows step indicator when `step` prop is provided
5. Drag-and-drop zone accepts PNG, JPEG, WebP, SVG
6. Validation errors appear inline
7. Valid images show preview with "Continue" button
8. "Continue" stores image as base64 in sessionStorage, navigates to `/preview`
9. All text uses i18n keys
10. E2E tests pass

---

## 2. Technical Description

### High-Level Approach

1. **Update shared components:**
   - `Header.tsx` - Brutalist styling + optional step indicator
   - `Footer.tsx` - Brutalist styling (black bg, yellow text)

2. **Install dependencies:**
   - `react-dropzone` for drag-and-drop
   - shadcn `alert` (if not installed)

3. **Create upload-specific components:**
   - `UploadProgressBar` - Black bar with yellow progress
   - `UploadDropzone` - Main container delegating to states
   - `DropzoneIdle` / `DropzoneSuccess` / `DropzoneError` / `DropzoneValidating`
   - `ImageRequirements` / `RequirementItem`

4. **Create hook:** `useImageUpload` for state orchestration

5. **Route module:** Composes all components

### Architecture Decisions

- **Shared components updated**: Header/Footer change globally
- **Small components**: Each visual section is its own component
- **shadcn/ui first**: Use Button, Alert where applicable
- **Client-side only**: No server action, sessionStorage persistence

---

## 2.1. Architecture Gate

- **Pages are puzzles:** `upload.tsx` composes Header, content, Footer
- **Loaders/actions are thin:** Loader only fetches user session
- **Business logic is not in components:**
  - Validation in `app/services/imageValidation.ts`
  - State orchestration in `app/hooks/useImageUpload.ts`
  - Components are purely presentational

### Route Module Summary

| Route | Loader | Action | Components | Services |
|-------|--------|--------|------------|----------|
| `/upload` | Get user session | None | `Header`, `UploadProgressBar`, `UploadDropzone`, `ImageRequirements`, `Footer` | None (hook uses service) |

### Component Hierarchy

```
upload.tsx (route)
├── Header (shared, with step prop)
├── UploadProgressBar
├── main content
│   ├── Page title (inline JSX)
│   ├── UploadDropzone
│   │   ├── DropzoneIdle
│   │   ├── DropzoneSuccess
│   │   ├── DropzoneError
│   │   └── DropzoneValidating
│   └── ImageRequirements
│       └── RequirementItem (x4)
└── Footer (shared)
```

---

## 3. Files to Change/Create

### Dependencies

**Objective:** Add react-dropzone and missing shadcn components

```pseudocode
NPM INSTALL:
  react-dropzone

SHADCN ADD (if not present):
  alert
END
```

---

### `app/routes.ts`

**Objective:** Register the `/upload` route

```pseudocode
ADD ROUTE:
  route('upload', 'routes/upload.tsx')
END
```

---

### `app/components/Header.tsx` (MODIFY)

**Objective:** Update to brutalist styling + optional step indicator

```pseudocode
COMPONENT Header
  PROPS:
    - session: Session | null
    - user: User | null
    - step?: { current: number, total: number, label: string } (optional)

  USE: useTranslation, useNavigate

  RENDER:
    - header.border-b-8.border-black.p-6
    - IF step: bg-yellow-300
    - ELSE: bg-white
    - div.max-w-7xl.mx-auto.flex.justify-between.items-center
      - Link to "/"
        - h1.text-3xl.font-black.uppercase.tracking-tight "FaviconForge"
      - div.flex.gap-4.items-center
        - IF step: span.font-bold.text-sm "STEP {current}/{total}: {label}"
        - IF user: UserDropdown
        - ELSE: Button(login) brutalist styling
        - LanguageSelector
END
```

---

### `app/components/landing/Footer.tsx` (MODIFY)

**Objective:** Update to brutalist styling

```pseudocode
COMPONENT Footer
  USE: useTranslation

  RENDER:
    - footer.bg-black.text-yellow-300.border-t-8.border-yellow-300.py-8
    - div.max-w-7xl.mx-auto.px-6.text-center
      - p.font-black.text-sm
        - "© 2025 FAVICONFORGE • TERMS • PRIVACY"
END
```

---

### `app/routes/upload.tsx`

**Objective:** Route module that composes the upload page

```pseudocode
LOADER
  INPUT: request
  PROCESS: Get current user session
  OUTPUT: { user, session }
END

META
  RETURN: title "Upload - FaviconForge"
END

COMPONENT UploadPage
  USE: useLoaderData

  RENDER:
    - div.min-h-screen.bg-white.font-mono
    - Header(session, user, step={ current: 1, total: 3, label: "UPLOAD" })
    - UploadProgressBar(progress=33)
    - main.max-w-4xl.mx-auto.px-6.py-20
      - div.mb-12 (title section)
        - h2.text-6xl.font-black.uppercase.mb-4.leading-none
          - "Upload Your" + br + span.bg-black.text-white.px-2 "Image"
        - p.text-xl.font-bold.border-l-8.border-black.pl-4.mt-6
          - t('upload_subtitle')
      - UploadDropzone
      - ImageRequirements (mt-12)
    - Footer

  NO BUSINESS LOGIC
END
```

---

### `app/components/upload/UploadProgressBar.tsx`

**Objective:** Black progress bar with yellow indicator (from mockup lines 24-26)

```pseudocode
COMPONENT UploadProgressBar
  PROPS:
    - progress: number (0-100)

  RENDER:
    - div.bg-black.h-4.relative
    - div.bg-yellow-300.h-full with style={{ width: `${progress}%` }}
    - IF progress < 100: add border-r-4.border-black
END
```

---

### `app/components/upload/UploadDropzone.tsx`

**Objective:** Main dropzone container that renders state-specific children

```pseudocode
COMPONENT UploadDropzone
  USE:
    - useImageUpload() hook
    - useDropzone() from react-dropzone

  DERIVE currentState from hook

  RENDER:
    - div with dropzone getRootProps()
    - Brutalist border-8.border-black.p-12
    - Dynamic classes based on state:
      - idle: bg-white
      - dragActive: bg-yellow-300 border-dashed
      - success: bg-green-200
      - error: bg-white (error shown inside)
      - validating: bg-white

    SWITCH currentState:
      - idle: <DropzoneIdle />
      - dragActive: <DropzoneIdle isDragActive />
      - validating: <DropzoneValidating />
      - success: <DropzoneSuccess />
      - error: <DropzoneError />

    - Hidden input with getInputProps()
END
```

---

### `app/components/upload/DropzoneIdle.tsx`

**Objective:** Idle/drag-active state UI

```pseudocode
COMPONENT DropzoneIdle
  PROPS:
    - isDragActive: boolean

  USE: useTranslation

  RENDER:
    - div.text-center.space-y-8
    - UploadIcon
    - div:
      - p.text-3xl.font-black.uppercase.mb-4
        - IF isDragActive: t('upload_drop_here')
        - ELSE: t('upload_drag_drop')
      - p.text-xl.font-bold.mb-6 t('upload_or_click')
      - label.cursor-pointer
        - span (styled as button) t('upload_browse_files')
    - div.border-t-4.border-black.pt-8
      - p.font-bold.text-sm.uppercase t('upload_accepted_formats')
      - p.font-black.text-2xl.mt-2 t('upload_formats_list')
END
```

---

### `app/components/upload/DropzoneSuccess.tsx`

**Objective:** Success state with preview

```pseudocode
COMPONENT DropzoneSuccess
  PROPS:
    - fileName: string
    - fileSize: string
    - previewUrl: string
    - onContinue: () => void
    - onChooseDifferent: () => void

  USE: useTranslation

  RENDER:
    - div.text-center.space-y-8
    - CheckIcon (white box with green checkmark)
    - div:
      - p.text-3xl.font-black.uppercase.text-green-600.mb-2 t('upload_success')
      - p.text-xl.font-bold fileName
      - p.text-lg.font-bold.text-gray-600 fileSize
    - div.flex.gap-4.justify-center
      - Button secondary onClick={onChooseDifferent} t('upload_choose_different')
      - Button primary onClick={onContinue} t('upload_continue') + " →"
END
```

---

### `app/components/upload/DropzoneError.tsx`

**Objective:** Error state with message

```pseudocode
COMPONENT DropzoneError
  PROPS:
    - errorKey: string
    - errorParams?: Record<string, string | number>
    - onTryAgain: () => void

  USE: useTranslation

  RENDER:
    - div.border-8.border-red-600.p-8.bg-red-100
    - div.flex.items-start.gap-4
      - div.text-4xl "⚠"
      - div:
        - h3.text-2xl.font-black.uppercase.text-red-600.mb-2
          - t('upload_error_title') + ": " + errorTitle
        - p.font-bold.text-lg t(errorKey, errorParams)
    - Button onClick={onTryAgain} t('upload_try_again')
END
```

---

### `app/components/upload/DropzoneValidating.tsx`

**Objective:** Loading state while validating

```pseudocode
COMPONENT DropzoneValidating
  USE: useTranslation

  RENDER:
    - div.text-center.space-y-8
    - div.w-32.h-32.mx-auto.border-8.border-black.bg-yellow-300
      - Pulsing animation or spinner
    - p.text-3xl.font-black.uppercase t('upload_validating')
END
```

---

### `app/components/upload/ImageRequirements.tsx`

**Objective:** Yellow requirements checklist

```pseudocode
COMPONENT ImageRequirements
  USE: useTranslation

  CONST requirements = [
    'upload_req_square',
    'upload_req_min_size',
    'upload_req_max_file',
    'upload_req_format'
  ]

  RENDER:
    - div.mt-12.border-8.border-black.p-8.bg-yellow-300
    - h3.text-2xl.font-black.uppercase.mb-6 t('upload_requirements_title')
    - ul.space-y-3
      - requirements.map(key => <RequirementItem text={t(key)} />)
END
```

---

### `app/components/upload/RequirementItem.tsx`

**Objective:** Single requirement with checkmark

```pseudocode
COMPONENT RequirementItem
  PROPS:
    - text: string

  RENDER:
    - li.flex.items-start.gap-3.font-bold.text-lg
    - span.text-2xl.text-green-600 "✓"
    - span text
END
```

---

### `app/components/upload/UploadIcon.tsx`

**Objective:** Upload icon in yellow box

```pseudocode
COMPONENT UploadIcon
  RENDER:
    - div.w-32.h-32.mx-auto.border-8.border-black.bg-yellow-300.flex.items-center.justify-center
    - svg.w-16.h-16 (upload arrow icon)
END
```

---

### `app/components/upload/CheckIcon.tsx`

**Objective:** Checkmark icon in white box

```pseudocode
COMPONENT CheckIcon
  RENDER:
    - div.w-32.h-32.mx-auto.border-8.border-black.bg-white.flex.items-center.justify-center
    - svg.w-16.h-16.text-green-600 (checkmark icon)
END
```

---

### `app/components/upload/index.ts`

**Objective:** Barrel export for upload components

```pseudocode
EXPORT:
  - UploadProgressBar
  - UploadDropzone
  - ImageRequirements
END
```

---

### `app/hooks/useImageUpload.ts`

**Objective:** Orchestrate file upload state, validation, and navigation

```pseudocode
HOOK useImageUpload
  STATE:
    - file: File | null
    - previewUrl: string | null
    - validationError: { errorKey, errorParams } | null
    - isValidating: boolean
    - isValid: boolean

  USE: useNavigate

  FUNCTION handleFileDrop(acceptedFiles: File[])
    - Take first file
    - Set isValidating = true, clear errors
    - Call validateImage(file) from service
    - IF valid:
        - Create previewUrl with URL.createObjectURL
        - Set file, previewUrl, isValid = true
    - IF invalid:
        - Set validationError { errorKey, errorParams }
    - Set isValidating = false
  END

  FUNCTION handleContinue()
    - Read file as base64 via FileReader
    - Store in sessionStorage('faviconforge_source_image')
    - navigate('/preview')
  END

  FUNCTION clearFile()
    - Revoke previewUrl if exists
    - Reset all state to initial
  END

  EFFECT cleanup: revoke previewUrl on unmount

  COMPUTED state:
    - IF isValidating: 'validating'
    - ELIF validationError: 'error'
    - ELIF isValid: 'success'
    - ELSE: 'idle'

  RETURN {
    file, previewUrl, validationError,
    isValidating, isValid, state,
    handleFileDrop, handleContinue, clearFile
  }
END
```

---

### `app/locales/en.json`

**Objective:** Add English translations

```pseudocode
ADD KEYS:
  "upload_step_label": "STEP {{current}}/{{total}}: UPLOAD"
  "upload_title_line1": "Upload Your"
  "upload_title_line2": "Image"
  "upload_subtitle": "Square images only. Minimum 512x512px. Max 10MB."
  "upload_drag_drop": "DRAG & DROP"
  "upload_drop_here": "DROP IT HERE!"
  "upload_or_click": "or click to browse"
  "upload_browse_files": "Browse Files"
  "upload_validating": "Validating..."
  "upload_success": "FILE UPLOADED!"
  "upload_choose_different": "Choose Different"
  "upload_continue": "Continue"
  "upload_try_again": "Try Again"
  "upload_error_title": "ERROR"
  "upload_accepted_formats": "Accepted formats:"
  "upload_formats_list": "PNG • JPEG • WebP • SVG"
  "upload_requirements_title": "Image Requirements:"
  "upload_req_square": "Square aspect ratio (1:1)"
  "upload_req_min_size": "Minimum 512×512 pixels"
  "upload_req_max_file": "Maximum 10MB file size"
  "upload_req_format": "PNG, JPEG, WebP or SVG format"
END
```

---

### `app/locales/es.json`

**Objective:** Add Spanish translations

```pseudocode
ADD KEYS:
  "upload_step_label": "PASO {{current}}/{{total}}: SUBIR"
  "upload_title_line1": "Sube Tu"
  "upload_title_line2": "Imagen"
  "upload_subtitle": "Solo imagenes cuadradas. Minimo 512x512px. Max 10MB."
  "upload_drag_drop": "ARRASTRA Y SUELTA"
  "upload_drop_here": "SUELTALA AQUI!"
  "upload_or_click": "o haz clic para explorar"
  "upload_browse_files": "Explorar Archivos"
  "upload_validating": "Validando..."
  "upload_success": "ARCHIVO SUBIDO!"
  "upload_choose_different": "Elegir Otro"
  "upload_continue": "Continuar"
  "upload_try_again": "Intentar de Nuevo"
  "upload_error_title": "ERROR"
  "upload_accepted_formats": "Formatos aceptados:"
  "upload_formats_list": "PNG • JPEG • WebP • SVG"
  "upload_requirements_title": "Requisitos de Imagen:"
  "upload_req_square": "Relacion de aspecto cuadrada (1:1)"
  "upload_req_min_size": "Minimo 512×512 pixeles"
  "upload_req_max_file": "Tamano maximo 10MB"
  "upload_req_format": "Formato PNG, JPEG, WebP o SVG"
END
```

---

## 4. I18N

### Existing keys to reuse

- `login` - Header login button
- `image_invalid_format`, `image_file_too_large`, `image_too_small`, `image_not_square`, `image_load_error` - Validation errors

### New keys: 22 total

(See tables in sections 3 for en.json and es.json)

---

## 5. E2E Test Plan

**Test file:** `tests/e2e/upload.spec.ts`

### Test 1: Upload page renders correctly
- **Steps:** Navigate to `/upload`
- **Expected:** Yellow header with step indicator, progress bar, dropzone, requirements visible

### Test 2: Valid PNG shows success state
- **Preconditions:** Valid 512x512 PNG
- **Steps:** Upload valid PNG
- **Expected:** "FILE UPLOADED!" + Continue button visible

### Test 3: Invalid format shows error
- **Preconditions:** GIF file
- **Steps:** Upload GIF
- **Expected:** Error about invalid format, Try Again button

### Test 4: Non-square image shows error
- **Preconditions:** 600x400 PNG
- **Steps:** Upload non-square PNG
- **Expected:** Error about aspect ratio

### Test 5: Too small image shows error
- **Preconditions:** 200x200 PNG
- **Steps:** Upload small PNG
- **Expected:** Error about minimum size

### Test 6: Continue stores and navigates
- **Preconditions:** Valid PNG
- **Steps:** Upload + click Continue
- **Expected:** URL = `/preview`, sessionStorage has `faviconforge_source_image`

### Test 7: Try Again resets state
- **Preconditions:** GIF file
- **Steps:** Upload GIF (error) + click Try Again
- **Expected:** Returns to idle state

---

## 6. Definition of Done

1. `npm run test:e2e -- tests/e2e/upload.spec.ts --retries=1` passes
2. `npm run typecheck` passes
3. `npm run lint` passes
4. All acceptance criteria met

---

## 7. Test Assets

Create in `tests/fixtures/images/`:

| File | Description |
|------|-------------|
| `valid-512x512.png` | Valid square PNG |
| `invalid-format.gif` | GIF for format test |
| `non-square-600x400.png` | Non-square PNG |
| `too-small-200x200.png` | Small PNG |

---

## 8. Files Summary

### Modified (shared components)
| File | Change |
|------|--------|
| `app/components/Header.tsx` | Brutalist styling + step prop |
| `app/components/landing/Footer.tsx` | Brutalist styling |

### New files (11 total)
| File | Lines (est) |
|------|-------------|
| `app/routes/upload.tsx` | ~50 |
| `app/hooks/useImageUpload.ts` | ~80 |
| `app/components/upload/UploadProgressBar.tsx` | ~15 |
| `app/components/upload/UploadDropzone.tsx` | ~45 |
| `app/components/upload/DropzoneIdle.tsx` | ~35 |
| `app/components/upload/DropzoneSuccess.tsx` | ~35 |
| `app/components/upload/DropzoneError.tsx` | ~30 |
| `app/components/upload/DropzoneValidating.tsx` | ~15 |
| `app/components/upload/ImageRequirements.tsx` | ~25 |
| `app/components/upload/RequirementItem.tsx` | ~12 |
| `app/components/upload/UploadIcon.tsx` | ~12 |
| `app/components/upload/CheckIcon.tsx` | ~12 |
| `app/components/upload/index.ts` | ~5 |

---

_Document created: 2025-01-03_
_Updated: Header/Footer are shared, modified to brutalist style_
