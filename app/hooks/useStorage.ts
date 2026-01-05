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
    let cancelled = false

    // SSR check
    if (typeof window === 'undefined' || !window.indexedDB) {
      // Use timeout to avoid synchronous setState in effect
      const timer = setTimeout(() => {
        if (!cancelled) {
          setState('error')
          setError({
            code: 'storage_not_available',
            message: 'IndexedDB is not available in this browser',
          })
        }
      }, 0)
      return () => {
        cancelled = true
        clearTimeout(timer)
      }
    }

    openDatabase()
      .then((db) => {
        if (!cancelled) {
          dbRef.current = db
          setState('ready')
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setState('error')
          setError({
            code: 'storage_not_available',
            message: err?.message || 'Failed to open database',
          })
        }
      })

    // Cleanup on unmount
    return () => {
      cancelled = true
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
