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
