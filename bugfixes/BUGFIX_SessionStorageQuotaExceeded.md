# BUGFIX_SessionStorageQuotaExceeded.md

## 1. Bug Description

### Current Behavior (Bug)

When a user uploads a high-resolution image (>5MB) and clicks the "Preview" button, a `QuotaExceededError` is thrown and the application fails to navigate to the preview page.

**Error message:**
```
QuotaExceededError: Failed to execute 'setItem' on 'Storage':
Setting the value of 'faviconforge_source_image' exceeded the quota.
at reader.onload (useImageUpload.ts:56:22)
```

**Steps to reproduce:**
1. Navigate to `/upload`
2. Drop or select a high-resolution image (e.g., 2048x2048 PNG, ~8MB)
3. Wait for validation to complete (success state shown)
4. Click "Continuar →" (Preview) button
5. **Bug:** Console error appears, navigation fails, user is stuck on upload page

### Expected Behavior (After Fix)

After clicking "Preview", the app should:
1. Save the image to IndexedDB (without quota errors)
2. Navigate to `/preview` successfully
3. Support images up to 10MB+ in size
4. Show clear error message if IndexedDB is unavailable

## 2. Technical Analysis

### Storage Flow

**Current implementation:**
1. User uploads File (Blob)
2. `useImageUpload.ts:56` converts to base64 via `FileReader.readAsDataURL()`
3. Stores base64 string in `sessionStorage.setItem('faviconforge_source_image', base64)`
4. Later retrieved by `useFaviconGeneration.ts:27` for preview generation
5. Cached again (redundantly) in `faviconCache.ts:50` as part of favicon cache

**Storage overhead:**
- Original PNG: 8MB
- Base64 encoded: 8MB × 1.37 = ~10.96MB
- **sessionStorage limit:** 5-10MB (browser dependent)
- **Result:** QuotaExceededError

### Root Cause

**OBVIOUS:** sessionStorage has a hard limit of ~5-10MB. Base64 encoding adds 37% overhead, making even 6MB images fail to store.

**Locations:**
- `app/hooks/useImageUpload.ts:56` - Initial storage (base64 to sessionStorage)
- `app/services/faviconCache.ts:50` - Redundant storage of source image in cache
- `app/hooks/useFaviconGeneration.ts:27` - Retrieval of base64 from sessionStorage

**Why sessionStorage was used:** Likely chosen for simplicity (synchronous API), but didn't account for large images.

### Why IndexedDB?

- Quota: 50MB+ (browser managed, much larger)
- Native Blob support: No base64 conversion needed (27% storage savings)
- Async API: Better for large data operations

## 3. Solution Plan

### Strategy

Migrate from **sessionStorage** to **IndexedDB** with:
1. `useStorage()` hook pattern for async initialization
2. Direct Blob storage (no base64 conversion)
3. Refactored `generateAllFormats()` to accept Blobs
4. Explicit loading states for async checks
5. Clear error messages if IndexedDB unavailable

### New Files

#### `app/lib/idb.ts`

**Objective:** Low-level IndexedDB utilities for database initialization and CRUD operations.

```typescript
const DB_NAME = 'faviconforge'
const DB_VERSION = 1

export type IDBStores = 'images' | 'favicons'

/**
 * Opens the IndexedDB database, creating stores if needed.
 * Returns a Promise that resolves when DB is ready.
 */
export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains('images')) {
        db.createObjectStore('images', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('favicons')) {
        db.createObjectStore('favicons', { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export function getFromStore<T>(
  db: IDBDatabase,
  storeName: IDBStores,
  key: string
): Promise<T | null> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const request = store.get(key)

    request.onsuccess = () => resolve(request.result ?? null)
    request.onerror = () => reject(request.error)
  })
}

export function putInStore<T extends { id: string }>(
  db: IDBDatabase,
  storeName: IDBStores,
  data: T
): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const request = store.put(data)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export function deleteFromStore(
  db: IDBDatabase,
  storeName: IDBStores,
  key: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const request = store.delete(key)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export function clearStore(
  db: IDBDatabase,
  storeName: IDBStores
): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const request = store.clear()

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}
```

#### `app/services/storage.types.ts`

**Objective:** TypeScript types for storage schema.

```typescript
export type SourceImageData = {
  id: 'source_image'
  blob: Blob
  filename: string
  mimeType: string
  timestamp: number
}

export type CachedFaviconFormat = {
  name: string
  blob: Blob
  path: string
  size: number
  tier: 'free' | 'premium'
  mimeType: string
}

export type FaviconCacheData = {
  id: 'favicon_cache'
  formats: CachedFaviconFormat[]
  manifest: string | null
  browserConfig: string | null
  htmlSnippet: string
  sourceImage: {
    blob: Blob
    filename: string
    mimeType: string
  }
  timestamp: number
}
```

#### `app/hooks/useStorage.ts`

**Objective:** React hook that handles async IndexedDB initialization and provides storage methods.

```typescript
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  openDatabase,
  getFromStore,
  putInStore,
  deleteFromStore,
  clearStore,
} from '~/lib/idb'
import type { SourceImageData, FaviconCacheData } from '~/services/storage.types'

type StorageState = 'loading' | 'ready' | 'error'

type StorageError = {
  code: 'storage_not_available' | 'storage_quota_exceeded' | 'storage_error'
  message: string
}

export type UseStorageReturn = {
  state: StorageState
  error: StorageError | null

  // Source image operations
  getSourceImage: () => Promise<SourceImageData | null>
  setSourceImage: (blob: Blob, filename: string, mimeType: string) => Promise<void>
  clearSourceImage: () => Promise<void>

  // Favicon cache operations
  getFaviconCache: () => Promise<FaviconCacheData | null>
  setFaviconCache: (data: Omit<FaviconCacheData, 'id'>) => Promise<void>
  clearFaviconCache: () => Promise<void>

  // Clear all
  clearAll: () => Promise<void>
}

export function useStorage(): UseStorageReturn {
  const [state, setState] = useState<StorageState>('loading')
  const [error, setError] = useState<StorageError | null>(null)
  const dbRef = useRef<IDBDatabase | null>(null)

  // Initialize database on mount
  useEffect(() => {
    // SSR check
    if (typeof window === 'undefined' || !window.indexedDB) {
      setState('error')
      setError({
        code: 'storage_not_available',
        message: 'IndexedDB is not available in this browser',
      })
      return
    }

    openDatabase()
      .then((db) => {
        dbRef.current = db
        setState('ready')
      })
      .catch((err) => {
        setState('error')
        setError({
          code: 'storage_not_available',
          message: err?.message || 'Failed to open database',
        })
      })

    // Cleanup on unmount
    return () => {
      dbRef.current?.close()
    }
  }, [])

  // Helper to ensure DB is ready before operations
  const withDb = useCallback(
    async <T>(operation: (db: IDBDatabase) => Promise<T>): Promise<T> => {
      if (!dbRef.current) {
        throw new Error('storage_not_available')
      }
      try {
        return await operation(dbRef.current)
      } catch (err) {
        if (err instanceof DOMException && err.name === 'QuotaExceededError') {
          throw new Error('storage_quota_exceeded')
        }
        throw err
      }
    },
    []
  )

  // Source image operations
  const getSourceImage = useCallback(async (): Promise<SourceImageData | null> => {
    return withDb((db) => getFromStore<SourceImageData>(db, 'images', 'source_image'))
  }, [withDb])

  const setSourceImage = useCallback(
    async (blob: Blob, filename: string, mimeType: string): Promise<void> => {
      const data: SourceImageData = {
        id: 'source_image',
        blob,
        filename,
        mimeType,
        timestamp: Date.now(),
      }
      return withDb((db) => putInStore(db, 'images', data))
    },
    [withDb]
  )

  const clearSourceImage = useCallback(async (): Promise<void> => {
    return withDb((db) => deleteFromStore(db, 'images', 'source_image'))
  }, [withDb])

  // Favicon cache operations
  const getFaviconCache = useCallback(async (): Promise<FaviconCacheData | null> => {
    return withDb((db) => getFromStore<FaviconCacheData>(db, 'favicons', 'favicon_cache'))
  }, [withDb])

  const setFaviconCache = useCallback(
    async (data: Omit<FaviconCacheData, 'id'>): Promise<void> => {
      const cacheData: FaviconCacheData = {
        id: 'favicon_cache',
        ...data,
      }
      return withDb((db) => putInStore(db, 'favicons', cacheData))
    },
    [withDb]
  )

  const clearFaviconCache = useCallback(async (): Promise<void> => {
    return withDb((db) => deleteFromStore(db, 'favicons', 'favicon_cache'))
  }, [withDb])

  // Clear all
  const clearAll = useCallback(async (): Promise<void> => {
    await withDb(async (db) => {
      await clearStore(db, 'images')
      await clearStore(db, 'favicons')
    })
  }, [withDb])

  return {
    state,
    error,
    getSourceImage,
    setSourceImage,
    clearSourceImage,
    getFaviconCache,
    setFaviconCache,
    clearFaviconCache,
    clearAll,
  }
}
```

#### `tests/unit/storage.test.ts`

**Objective:** Unit tests for storage hook with fake-indexeddb.

**Test coverage:**
- Hook initializes to 'loading' then 'ready'
- `setSourceImage()` and `getSourceImage()` with Blobs
- `setFaviconCache()` and `getFaviconCache()` with structured data
- `clearSourceImage()` and `clearFaviconCache()` remove data correctly
- `clearAll()` removes all data
- Error state when IndexedDB unavailable
- QuotaExceededError handling

### Modified Files

#### `app/services/faviconGeneration.ts`

**Objective:** Refactor to accept Blob instead of base64 string.

**Location:** Lines 20-28 (loadImage function)

**BEFORE:**
```typescript
export function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('image_load_failed'))
    img.src = dataUrl
  })
}
```

**AFTER:**
```typescript
/**
 * Loads an image from a Blob
 */
export function loadImage(source: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    const objectUrl = URL.createObjectURL(source)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)  // Clean up after load
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)  // Clean up on error too
      reject(new Error('image_load_failed'))
    }
    img.src = objectUrl
  })
}
```

**Changes:**
1. Accept `Blob` instead of `string`
2. Create object URL for img.src
3. Revoke object URL in onload/onerror (safe because HTMLImageElement already decoded the data)

**Location:** Lines 72-79 (resizeImage function signature)

**BEFORE:**
```typescript
export async function resizeImage(
  imageData: string,
  size: number
): Promise<Blob> {
```

**AFTER:**
```typescript
export async function resizeImage(
  imageData: Blob,
  size: number
): Promise<Blob> {
```

**Location:** Lines 84-88 (generateMaskableIcon signature)

**BEFORE:**
```typescript
export async function generateMaskableIcon(
  imageData: string,
  size: number,
  backgroundColor: string
): Promise<Blob> {
```

**AFTER:**
```typescript
export async function generateMaskableIcon(
  imageData: Blob,
  size: number,
  backgroundColor: string
): Promise<Blob> {
```

**Location:** Lines 116-119 (generatePNGFormats signature)

**BEFORE:**
```typescript
export async function generatePNGFormats(
  imageData: string,
  isPremium: boolean
): Promise<GenerationResult[]> {
```

**AFTER:**
```typescript
export async function generatePNGFormats(
  imageData: Blob,
  isPremium: boolean
): Promise<GenerationResult[]> {
```

**Location:** Lines 167-170 (generateMaskableFormats signature)

**BEFORE:**
```typescript
export async function generateMaskableFormats(
  imageData: string,
  backgroundColor: string
): Promise<GenerationResult[]> {
```

**AFTER:**
```typescript
export async function generateMaskableFormats(
  imageData: Blob,
  backgroundColor: string
): Promise<GenerationResult[]> {
```

#### `app/services/faviconGeneration.types.ts`

**Location:** FaviconGenerationOptions type

**BEFORE:**
```typescript
export type FaviconGenerationOptions = {
  imageData: string
  isPremium: boolean
  manifestOptions?: ManifestOptions
}
```

**AFTER:**
```typescript
export type FaviconGenerationOptions = {
  imageData: Blob
  isPremium: boolean
  manifestOptions?: ManifestOptions
}
```

#### `app/hooks/useImageUpload.ts`

**Location:** Import and hook signature (top of file)

**BEFORE:**
```typescript
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { validateImage } from '~/services/imageValidation'
```

**AFTER:**
```typescript
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { validateImage } from '~/services/imageValidation'
import { useStorage } from '~/hooks/useStorage'
```

**Location:** Lines 12-18 (hook state)

**BEFORE:**
```typescript
export function useImageUpload() {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  // ...
```

**AFTER:**
```typescript
export function useImageUpload() {
  const navigate = useNavigate()
  const storage = useStorage()
  const [file, setFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  // ...
```

**Location:** Lines 49-60 (handleContinue function)

**BEFORE:**
```typescript
const handleContinue = async () => {
  if (!file) return

  // Read file as base64
  const reader = new FileReader()
  reader.onload = () => {
    const base64 = reader.result as string
    sessionStorage.setItem('faviconforge_source_image', base64)
    navigate('/preview')
  }
  reader.readAsDataURL(file)
}
```

**AFTER:**
```typescript
const handleContinue = async () => {
  if (!file) return

  // Check storage is ready
  if (storage.state !== 'ready') {
    setValidationError({
      errorKey: 'storage_not_available',
    })
    return
  }

  setIsSaving(true)

  try {
    // Store Blob directly (no base64 conversion)
    await storage.setSourceImage(file, file.name, file.type)
    navigate('/preview')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'storage_error'
    setValidationError({
      errorKey: errorMessage === 'storage_quota_exceeded'
        ? 'storage_quota_exceeded'
        : 'storage_error',
    })
  } finally {
    setIsSaving(false)
  }
}
```

**Location:** Return statement (add new values)

**BEFORE:**
```typescript
return {
  file,
  previewUrl,
  validationError,
  isValidating,
  isValid,
  state,
  handleFileDrop,
  handleContinue,
  clearFile,
}
```

**AFTER:**
```typescript
return {
  file,
  previewUrl,
  validationError,
  isValidating,
  isValid,
  isSaving,
  storageReady: storage.state === 'ready',
  state,
  handleFileDrop,
  handleContinue,
  clearFile,
}
```

#### `app/services/faviconCache.ts`

**Complete rewrite using IndexedDB via hook-compatible functions.**

**BEFORE:** (entire file)

**AFTER:**
```typescript
import type { GeneratedFavicons } from './faviconGeneration.types'
import type { FaviconCacheData, CachedFaviconFormat } from './storage.types'

/**
 * Converts GeneratedFavicons to cacheable format.
 * Called from useFaviconGeneration with storage instance.
 */
export function prepareFaviconCacheData(
  data: GeneratedFavicons,
  sourceBlob: Blob,
  sourceFilename: string,
  sourceMimeType: string
): Omit<FaviconCacheData, 'id'> {
  const formats: CachedFaviconFormat[] = data.formats.map((format) => ({
    name: format.name,
    blob: format.blob,
    path: format.path,
    size: format.size,
    tier: format.tier,
    mimeType: format.blob.type,
  }))

  return {
    formats,
    manifest: data.manifest,
    browserConfig: data.browserConfig,
    htmlSnippet: data.htmlSnippet,
    sourceImage: {
      blob: sourceBlob,
      filename: sourceFilename,
      mimeType: sourceMimeType,
    },
    timestamp: Date.now(),
  }
}

/**
 * Restores GeneratedFavicons from cached data.
 */
export function restoreFaviconsFromCacheData(
  cached: FaviconCacheData
): GeneratedFavicons {
  return {
    formats: cached.formats.map((format) => ({
      name: format.name,
      blob: format.blob,
      path: format.path,
      size: format.size,
      tier: format.tier,
    })),
    warnings: [],
    manifest: cached.manifest,
    browserConfig: cached.browserConfig,
    htmlSnippet: cached.htmlSnippet,
  }
}
```

**Changes:**
1. Remove all sessionStorage usage
2. Export pure functions that work with data structures
3. Storage operations moved to useStorage hook
4. Remove blobToBase64/base64ToBlob helpers (no longer needed)

#### `app/hooks/useFaviconGeneration.ts`

**Location:** Imports (top of file)

**BEFORE:**
```typescript
import { useState, useEffect } from 'react'
import { generateAllFormats } from '~/services/faviconGeneration'
import type { FaviconFormat } from '~/services/faviconGeneration.types'
import { cacheFavicons } from '~/services/faviconCache'
```

**AFTER:**
```typescript
import { useState, useEffect, useRef } from 'react'
import { generateAllFormats } from '~/services/faviconGeneration'
import type { FaviconFormat } from '~/services/faviconGeneration.types'
import { useStorage } from '~/hooks/useStorage'
import {
  prepareFaviconCacheData,
  restoreFaviconsFromCacheData,
} from '~/services/faviconCache'
```

**Location:** Type definitions

**BEFORE:**
```typescript
type GenerationState = 'idle' | 'generating' | 'complete' | 'error'
```

**AFTER:**
```typescript
type GenerationState = 'idle' | 'loading' | 'generating' | 'complete' | 'error'
```

**Location:** UseFaviconGenerationReturn type

**BEFORE:**
```typescript
export type UseFaviconGenerationReturn = {
  generationState: GenerationState
  formats: GeneratedFormat[]
  error: string | null
  sourceImage: string | null
  getFaviconUrl: (targetSize: number) => string | null
  retry: () => void
  hasSourceImage: boolean
}
```

**AFTER:**
```typescript
export type UseFaviconGenerationReturn = {
  generationState: GenerationState
  formats: GeneratedFormat[]
  error: string | null
  sourceImageUrl: string | null
  getFaviconUrl: (targetSize: number) => string | null
  retry: () => void
  hasSourceImage: boolean | 'loading'
}
```

**Location:** Lines 25-28 (remove getSourceImage function)

**DELETE:**
```typescript
function getSourceImage(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem('faviconforge_source_image')
}
```

**Location:** Lines 30-106 (entire hook body)

**AFTER:**
```typescript
export function useFaviconGeneration(): UseFaviconGenerationReturn {
  const storage = useStorage()
  const [generationState, setGenerationState] = useState<GenerationState>('idle')
  const [formats, setFormats] = useState<GeneratedFormat[]>([])
  const [error, setError] = useState<string | null>(null)
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null)
  const [hasSourceImage, setHasSourceImage] = useState<boolean | 'loading'>('loading')

  // Track source metadata for caching
  const sourceMetadataRef = useRef<{ filename: string; mimeType: string } | null>(null)

  // Check for source image when storage is ready
  useEffect(() => {
    if (storage.state === 'loading') {
      setHasSourceImage('loading')
      return
    }

    if (storage.state === 'error') {
      setHasSourceImage(false)
      setError('storage_not_available')
      return
    }

    // Storage is ready, check for source image
    const checkSource = async () => {
      const sourceData = await storage.getSourceImage()
      setHasSourceImage(!!sourceData)
    }
    checkSource()
  }, [storage.state, storage.getSourceImage])

  const generateFavicons = async () => {
    if (storage.state !== 'ready') {
      setError('storage_not_available')
      return
    }

    setGenerationState('loading')

    try {
      const sourceData = await storage.getSourceImage()
      if (!sourceData) {
        setError('no_source_image')
        setGenerationState('error')
        return
      }

      // Store metadata for caching later
      sourceMetadataRef.current = {
        filename: sourceData.filename,
        mimeType: sourceData.mimeType,
      }

      // Create object URL for display
      // NOTE: This URL is managed by the component lifecycle
      const displayUrl = URL.createObjectURL(sourceData.blob)
      setSourceImageUrl(displayUrl)
      setGenerationState('generating')

      // Generate favicons with Blob directly
      const result = await generateAllFormats({
        imageData: sourceData.blob,
        isPremium: true,
      })

      // Cache the result
      const cacheData = prepareFaviconCacheData(
        result,
        sourceData.blob,
        sourceData.filename,
        sourceData.mimeType
      )
      await storage.setFaviconCache(cacheData)

      // Convert blobs to object URLs for display
      const formatsWithUrls = result.formats.map((format: FaviconFormat) => ({
        name: format.name,
        tier: format.tier,
        size: format.size,
        blobUrl: URL.createObjectURL(format.blob),
      }))

      setFormats(formatsWithUrls)
      setGenerationState('complete')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      setGenerationState('error')
    }
  }

  // Generate on mount when storage is ready
  useEffect(() => {
    if (storage.state === 'ready' && generationState === 'idle') {
      generateFavicons()
    }
  }, [storage.state, generationState])

  // Cleanup: Revoke object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (sourceImageUrl) {
        URL.revokeObjectURL(sourceImageUrl)
      }
      formats.forEach((format) => {
        URL.revokeObjectURL(format.blobUrl)
      })
    }
  }, [sourceImageUrl, formats])

  const getFaviconUrl = (targetSize: number): string | null => {
    const format = formats.find((f) => f.size === targetSize)
    return format?.blobUrl ?? null
  }

  const retry = () => {
    // Revoke old URLs before retry
    formats.forEach((format) => URL.revokeObjectURL(format.blobUrl))
    if (sourceImageUrl) URL.revokeObjectURL(sourceImageUrl)

    setFormats([])
    setError(null)
    setSourceImageUrl(null)
    setGenerationState('idle')
    // Will trigger generation via useEffect
  }

  return {
    generationState,
    formats,
    error,
    sourceImageUrl,
    getFaviconUrl,
    retry,
    hasSourceImage,
  }
}
```

**Key changes:**
1. Use `useStorage()` hook instead of direct sessionStorage
2. Add 'loading' state for hasSourceImage
3. Object URLs managed in component lifecycle, revoked on unmount
4. Pass Blob to `generateAllFormats()` directly
5. Store source metadata for caching
6. Rename `sourceImage` to `sourceImageUrl` for clarity

#### `app/hooks/useDownload.ts`

**Location:** Imports (top of file)

Add:
```typescript
import { useStorage } from '~/hooks/useStorage'
import { restoreFaviconsFromCacheData } from '~/services/faviconCache'
```

**Location:** Lines 44-46 (hasSourceImage)

**BEFORE:**
```typescript
const hasSourceImage = useMemo(() => {
  if (typeof window === 'undefined') return false
  return getCachedFavicons() !== null
}, [])
```

**AFTER:**
```typescript
const storage = useStorage()
const [hasSourceImage, setHasSourceImage] = useState<boolean | 'loading'>('loading')

useEffect(() => {
  if (storage.state === 'loading') {
    setHasSourceImage('loading')
    return
  }

  if (storage.state === 'error') {
    setHasSourceImage(false)
    return
  }

  const checkCache = async () => {
    const cached = await storage.getFaviconCache()
    setHasSourceImage(cached !== null)
  }
  checkCache()
}, [storage.state, storage.getFaviconCache])
```

**Location:** Lines 49-81 (generateZip function)

**BEFORE:**
```typescript
const generateZip = async (): Promise<ZipResult | null> => {
  try {
    setDownloadState('generating')

    const cached = getCachedFavicons()
    if (!cached) {
      setDownloadState('error')
      return null
    }

    const restored = restoreFaviconsFromCache()
    // ... rest
  }
}
```

**AFTER:**
```typescript
const generateZip = async (): Promise<ZipResult | null> => {
  try {
    setDownloadState('generating')

    const cached = await storage.getFaviconCache()
    if (!cached) {
      setDownloadState('error')
      return null
    }

    const restored = restoreFaviconsFromCacheData(cached)
    // ... rest
  }
}
```

#### `app/locales/en.json`

Add these keys:

```json
{
  "storage_error": "Failed to save image. Please try again.",
  "storage_quota_exceeded": "Image too large for browser storage. Please use a smaller image or clear your browser cache.",
  "storage_not_available": "Browser storage not available. Please check privacy settings or try a different browser."
}
```

#### `app/locales/es.json`

Add these keys:

```json
{
  "storage_error": "Error al guardar la imagen. Por favor, inténtelo de nuevo.",
  "storage_quota_exceeded": "Imagen demasiado grande para el almacenamiento del navegador. Por favor, use una imagen más pequeña o limpie la caché del navegador.",
  "storage_not_available": "Almacenamiento del navegador no disponible. Por favor, verifique la configuración de privacidad o pruebe con otro navegador."
}
```

#### `package.json`

Add to devDependencies:

```json
{
  "devDependencies": {
    "fake-indexeddb": "^6.0.0"
  }
}
```

### E2E Test Updates

#### `tests/e2e/helpers/indexeddb.ts` (NEW FILE)

**Objective:** Helper functions for E2E tests to interact with IndexedDB.

```typescript
import type { Page } from '@playwright/test'

/**
 * Waits for IndexedDB to contain source image data.
 * This ensures the app has finished storing the image.
 */
export async function waitForSourceImageInIDB(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      return new Promise((resolve) => {
        const request = indexedDB.open('faviconforge', 1)
        request.onsuccess = () => {
          const db = request.result
          // Check if store exists (db might be empty if test runs before app initializes)
          if (!db.objectStoreNames.contains('images')) {
            db.close()
            resolve(false)
            return
          }
          const tx = db.transaction('images', 'readonly')
          const store = tx.objectStore('images')
          const getReq = store.get('source_image')
          getReq.onsuccess = () => {
            db.close()
            resolve(getReq.result !== undefined)
          }
          getReq.onerror = () => {
            db.close()
            resolve(false)
          }
        }
        request.onerror = () => resolve(false)
      })
    },
    { timeout: 10000 }
  )
}

/**
 * Waits for IndexedDB to contain favicon cache data.
 */
export async function waitForFaviconCacheInIDB(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      return new Promise((resolve) => {
        const request = indexedDB.open('faviconforge', 1)
        request.onsuccess = () => {
          const db = request.result
          if (!db.objectStoreNames.contains('favicons')) {
            db.close()
            resolve(false)
            return
          }
          const tx = db.transaction('favicons', 'readonly')
          const store = tx.objectStore('favicons')
          const getReq = store.get('favicon_cache')
          getReq.onsuccess = () => {
            db.close()
            resolve(getReq.result !== undefined)
          }
          getReq.onerror = () => {
            db.close()
            resolve(false)
          }
        }
        request.onerror = () => resolve(false)
      })
    },
    { timeout: 10000 }
  )
}

/**
 * Clears all IndexedDB data for the app.
 */
export async function clearIndexedDB(page: Page): Promise<void> {
  await page.evaluate(() => {
    return new Promise<void>((resolve) => {
      const request = indexedDB.deleteDatabase('faviconforge')
      request.onsuccess = () => resolve()
      request.onerror = () => resolve() // Resolve anyway, DB might not exist
    })
  })
}
```

#### `tests/e2e/upload.spec.ts`

**Changes:**
- Replace sessionStorage checks with IndexedDB verification using helpers
- Add `waitForSourceImageInIDB()` after clicking continue

#### `tests/e2e/preview.spec.ts`

**Changes:**
- Use `waitForFaviconCacheInIDB()` to verify cache after generation
- Update any sessionStorage references

#### `tests/e2e/download.spec.ts`

**Changes:**
- Replace `getCachedFavicons()` sessionStorage checks with IndexedDB helpers
- Use `waitForFaviconCacheInIDB()` before download assertions

### Unit Tests for faviconGeneration.ts

Since `generateAllFormats()` now accepts Blob instead of string, update existing unit tests:

#### `tests/unit/faviconGeneration.test.ts`

**Changes:**
- Replace base64 test data with Blob:
```typescript
// BEFORE
const testImageBase64 = 'data:image/png;base64,iVBORw0KGgo...'

// AFTER
const testImageBlob = new Blob(
  [Uint8Array.from(atob('iVBORw0KGgo...'), c => c.charCodeAt(0))],
  { type: 'image/png' }
)
```

- Update all calls to generation functions to pass Blob

## 4. Error Handling

### Error Scenarios

| Scenario | Hook State | User Message |
|----------|------------|--------------|
| **IndexedDB unavailable (private mode, disabled)** | `storage.state === 'error'` | `storage_not_available` |
| **Quota exceeded in IndexedDB** | `error.code === 'storage_quota_exceeded'` | `storage_quota_exceeded` |
| **SSR (window undefined)** | `storage.state === 'loading'` (never resolves) | N/A (server render) |
| **Storage ready, no image** | `hasSourceImage === false` | `no_source_image` |
| **Storage loading** | `hasSourceImage === 'loading'` | Show spinner/skeleton |

### Error Flow

1. `useStorage()` initializes, sets `state: 'loading'`
2. If IndexedDB fails to open → `state: 'error'`, `error.code: 'storage_not_available'`
3. If IndexedDB opens → `state: 'ready'`
4. On `setSourceImage()` quota error → throw `'storage_quota_exceeded'`
5. Consuming hook catches error, sets appropriate error key
6. UI component displays translated error message

## 5. Definition of Done

1. **New files created:**
   - [ ] `app/lib/idb.ts`
   - [ ] `app/hooks/useStorage.ts`
   - [ ] `app/services/storage.types.ts`
   - [ ] `tests/unit/storage.test.ts`
   - [ ] `tests/e2e/helpers/indexeddb.ts`

2. **Dependencies installed:**
   - [ ] `npm install -D fake-indexeddb`

3. **Modified files updated:**
   - [ ] `app/services/faviconGeneration.ts` (accept Blob)
   - [ ] `app/services/faviconGeneration.types.ts` (imageData: Blob)
   - [ ] `app/hooks/useImageUpload.ts` (use useStorage)
   - [ ] `app/services/faviconCache.ts` (pure functions, no sessionStorage)
   - [ ] `app/hooks/useFaviconGeneration.ts` (use useStorage, loading state)
   - [ ] `app/hooks/useDownload.ts` (use useStorage)
   - [ ] `app/locales/en.json` (error messages)
   - [ ] `app/locales/es.json` (error messages)
   - [ ] `package.json` (fake-indexeddb)
   - [ ] `tests/e2e/upload.spec.ts`
   - [ ] `tests/e2e/preview.spec.ts`
   - [ ] `tests/e2e/download.spec.ts`
   - [ ] `tests/unit/faviconGeneration.test.ts`

4. **Tests pass:**
   - [ ] `npm run test:unit` - All storage and faviconGeneration unit tests pass
   - [ ] `npm run test:e2e -- --retries=1` - All E2E tests pass
   - [ ] `npm run typecheck` - No type errors
   - [ ] `npm run lint` - No lint errors

5. **Manual verification:**
   - [ ] Upload 8MB image → succeeds without quota error
   - [ ] Navigate to preview → loads successfully
   - [ ] Reload page → data persists
   - [ ] Test in Chrome, Firefox, Safari (normal mode)
   - [ ] Test in Safari private mode → error message shows
   - [ ] Error messages display correctly in EN and ES
   - [ ] Loading states show while storage initializes

## 6. Migration Notes

### Data Migration Strategy

**Decision:** No automatic migration from existing sessionStorage data.

**Rationale:**
- Favicon data is ephemeral (only exists during upload → preview → download flow)
- Users naturally re-upload when starting a new session
- Avoids migration complexity and potential errors
- sessionStorage auto-clears when tab closes

**User impact:** Existing users in the middle of the flow will need to re-upload their image after deployment. This is acceptable given the temporary nature of the data.

### Cleanup of Legacy sessionStorage

On first load after deployment, the app could optionally clear old sessionStorage keys:
```typescript
// In useStorage hook init, after DB is ready
sessionStorage.removeItem('faviconforge_source_image')
sessionStorage.removeItem('faviconforge_favicon_cache')
```

This is optional but keeps storage clean.

## 7. Known Limitations

1. **Safari private mode:** IndexedDB is disabled, app will show error message
2. **Browser support:** Requires IndexedDB (all modern browsers support it)
3. **SSR compatibility:** Storage operations are client-only (state stays 'loading' during SSR)
4. **Concurrent tabs:** Multiple tabs can write to same IndexedDB (last write wins by timestamp)
5. **Private browsing:** Users must use normal browsing mode to use the app

## 8. Architecture Decisions

### Why `useStorage()` hook instead of singleton?

1. **Async initialization:** Hook can expose `state: 'loading' | 'ready' | 'error'`
2. **React lifecycle:** Cleanup on unmount (close DB connection)
3. **SSR safety:** Hook naturally handles `typeof window === 'undefined'`
4. **Testability:** Easier to mock in tests than global singleton
5. **Error propagation:** Component can react to storage errors in render

### Why refactor `generateAllFormats()` to accept Blob?

1. **Consistency:** End-to-end Blob handling, no conversions
2. **Performance:** Avoid base64 encoding overhead
3. **Memory:** Blob stays in memory once; base64 duplicates data
4. **Future-proof:** If we add Web Workers, Blobs transfer efficiently

### Why explicit loading state for `hasSourceImage`?

1. **Avoid flash of wrong state:** User sees spinner instead of "no image"
2. **Prevent race conditions:** Code can check `=== 'loading'` and wait
3. **Clear semantics:** `true | false | 'loading'` covers all cases

## 9. Diagrams

### Storage Flow (After Fix)

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Upload    │────▶│  useStorage  │────▶│    IndexedDB    │
│   (File)    │     │ setSourceImg │     │ images/source   │
└─────────────┘     └──────────────┘     └─────────────────┘
                                                   │
                                                   ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Preview   │◀────│  useStorage  │◀────│    IndexedDB    │
│   (Blob)    │     │ getSourceImg │     │ images/source   │
└─────────────┘     └──────────────┘     └─────────────────┘
       │
       ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│ Generation  │────▶│  useStorage  │────▶│    IndexedDB    │
│  (Blobs)    │     │ setFavCache  │     │ favicons/cache  │
└─────────────┘     └──────────────┘     └─────────────────┘
                                                   │
                                                   ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Download   │◀────│  useStorage  │◀────│    IndexedDB    │
│   (ZIP)     │     │ getFavCache  │     │ favicons/cache  │
└─────────────┘     └──────────────┘     └─────────────────┘
```

### Hook State Machine

```
useStorage:
  ┌─────────┐
  │ loading │──────────────────────────┐
  └────┬────┘                          │
       │                               │
  ┌────▼────┐                    ┌─────▼─────┐
  │  ready  │                    │   error   │
  └─────────┘                    └───────────┘

hasSourceImage:
  ┌───────────┐   storage ready   ┌───────────────┐
  │ 'loading' │──────────────────▶│ check IndexDB │
  └───────────┘                   └───────┬───────┘
                                          │
                        ┌─────────────────┴─────────────────┐
                        ▼                                   ▼
                   ┌─────────┐                        ┌───────────┐
                   │  true   │                        │   false   │
                   └─────────┘                        └───────────┘
```

## 10. Future Improvements

- [ ] Add storage usage monitoring/analytics
- [ ] Implement cache cleanup for old data (timestamp-based)
- [ ] Add compression for very large images before storage
- [ ] Consider server-side upload for premium tier (unlimited size)
- [ ] Add fallback to server-side storage for private browsing users
- [ ] Add retry logic with exponential backoff for transient IndexedDB errors
