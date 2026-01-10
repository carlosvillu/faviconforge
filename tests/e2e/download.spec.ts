import { test, expect } from '../fixtures/app.fixture'
import path from 'path'
import { fileURLToPath } from 'url'
import { clearIndexedDB, waitForFaviconCacheInIDB } from './helpers/indexeddb'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

test.describe('Download Page', () => {
  test('should redirect to /upload without cached data', async ({ page }) => {
    await clearIndexedDB(page)

    await page.goto('/upload')

    await page.goto('/download')

    await page.waitForURL('**/upload', { timeout: 5000 })
    expect(page.url()).toContain('/upload')
  })

  test('anonymous user can download free ZIP', async ({ page }) => {
    await page.goto('/upload')

    const fileInput = await page.locator('input[type="file"]')
    const validImagePath = path.join(
      __dirname,
      '../fixtures/images/valid-512x512.png'
    )
    await fileInput.setInputFiles(validImagePath)

    await page.waitForTimeout(500)

    const continueButton = page.getByRole('button', { name: /Continue|Continuar/i })
    await continueButton.click()

    await page.waitForURL('**/preview', { timeout: 5000 })
    await page.waitForTimeout(2000)

    await waitForFaviconCacheInIDB(page)

    // Navigate to download (this should have cached favicons)
    const downloadNavButton = page.getByRole('button', {
      name: /Download|Descargar/i,
    })
    await downloadNavButton.click()

    await page.waitForURL('**/download', { timeout: 5000 })

    // Free tier should be selected by default
    await expect(page.getByRole('button', { name: /€0/ })).toBeVisible()

    // Trigger download
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 })
    const downloadFreeButton = page.getByRole('button', {
      name: /Download Free|Descargar Gratis/i,
    })
    await downloadFreeButton.click()

    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/faviconforge-\d+\.zip/)
  })

  test('anonymous user sees login prompt for premium', async ({ page }) => {
    await page.goto('/upload')

    const fileInput = await page.locator('input[type="file"]')
    const validImagePath = path.join(
      __dirname,
      '../fixtures/images/valid-512x512.png'
    )
    await fileInput.setInputFiles(validImagePath)

    await page.waitForTimeout(500)
    const continueButton = page.getByRole('button', { name: /Continue|Continuar/i })
    await continueButton.click()
    await page.waitForURL('**/preview', { timeout: 5000 })
    await page.waitForTimeout(2000)

    await waitForFaviconCacheInIDB(page)

    const navButton = page.getByRole('button', { name: /Download|Descargar/i })
    await navButton.click()
    await page.waitForURL('**/download', { timeout: 5000 })

    // Select premium tier
    await page.getByRole('button', { name: /€5/ }).click()

    // Login button should point to /auth/login?redirect=/download
    const loginLink = page.getByRole('link', {
      name: /Login with Google|Iniciar con Google/i,
    })
    await expect(loginLink).toHaveAttribute(
      'href',
      '/auth/login?redirect=/download'
    )

    // Disabled buy button visible
    await expect(
      page.getByRole('button', { name: /Buy Premium|Comprar Premium/i })
    ).toBeVisible()
  })

  test('step indicator shows 3/3 and download label', async ({ page }) => {
    await page.goto('/upload')

    const fileInput = await page.locator('input[type="file"]')
    const validImagePath = path.join(
      __dirname,
      '../fixtures/images/valid-512x512.png'
    )
    await fileInput.setInputFiles(validImagePath)

    await page.waitForTimeout(500)
    const continueButton = page.getByRole('button', { name: /Continue|Continuar/i })
    await continueButton.click()
    await page.waitForURL('**/preview', { timeout: 5000 })
    await page.waitForTimeout(2000)

    await waitForFaviconCacheInIDB(page)

    const navButton = page.getByRole('button', { name: /Download|Descargar/i })
    await navButton.click()
    await page.waitForURL('**/download', { timeout: 5000 })

    await expect(
      page.getByText(/STEP 3\/3: DOWNLOAD|PASO 3\/3: DESCARGA/i)
    ).toBeVisible()

    const progressBar = await page.locator('div.bg-yellow-300.h-full')
    await expect(progressBar).toBeVisible()
  })

  test('back button navigates to preview', async ({ page }) => {
    await page.goto('/upload')

    const fileInput = await page.locator('input[type="file"]')
    const validImagePath = path.join(
      __dirname,
      '../fixtures/images/valid-512x512.png'
    )
    await fileInput.setInputFiles(validImagePath)

    await page.waitForTimeout(500)
    const continueButton = page.getByRole('button', { name: /Continue|Continuar/i })
    await continueButton.click()
    await page.waitForURL('**/preview', { timeout: 5000 })
    await page.waitForTimeout(2000)

    await waitForFaviconCacheInIDB(page)

    const navButton = page.getByRole('button', { name: /Download|Descargar/i })
    await navButton.click()
    await page.waitForURL('**/download', { timeout: 5000 })

    const backToPreview = page.getByRole('link', {
      name: /Back to Preview|Volver a Vista Previa/i,
    })
    await backToPreview.click()

    await page.waitForURL('**/preview', { timeout: 5000 })
    expect(page.url()).toContain('/preview')
  })
})
