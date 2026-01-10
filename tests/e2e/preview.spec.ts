import { test, expect } from '../fixtures/app.fixture'
import path from 'path'
import { fileURLToPath } from 'url'
import { clearIndexedDB, waitForSourceImageInIDB } from './helpers/indexeddb'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

test.describe('Preview Page', () => {
  test('should redirect to /upload without image in IndexedDB', async ({
    page,
  }) => {
    // Clear IndexedDB
    await clearIndexedDB(page)

    await page.goto('/upload')

    // Navigate directly to /preview
    await page.goto('/preview')

    // Should be redirected to /upload
    await page.waitForURL('**/upload', { timeout: 5000 })
    expect(page.url()).toContain('/upload')
  })

  test('should show skeletons then previews with valid image', async ({
    page,
  }) => {
    // Upload valid image on /upload
    await page.goto('/upload')
    const fileInput = await page.locator('input[type="file"]')
    const validImagePath = path.join(
      __dirname,
      '../fixtures/images/valid-512x512.png'
    )
    await fileInput.setInputFiles(validImagePath)

    // Wait for validation
    await page.waitForTimeout(500)

    // Click Continue
    const continueButton = page.getByRole('button', { name: /Continue|Continuar/i })
    await continueButton.click()

    // Wait for navigation to /preview
    await page.waitForURL('**/preview', { timeout: 5000 })

    // Verify header with step indicator
    await expect(
      page.getByText(/STEP 2\/3: PREVIEW|PASO 2\/3: PREVIEW/i)
    ).toBeVisible()

    // Verify progress bar shows 66%
    const progressBar = await page.locator('div.bg-yellow-300.h-full')
    await expect(progressBar).toBeVisible()

    // Wait for generation to complete (should be fast)
    await page.waitForTimeout(2000)

    // Verify all 6 preview cards are rendered with titles
    await expect(
      page.getByText(/Browser Tab|Pestana del Navegador/i).first()
    ).toBeVisible()
    await expect(
      page.getByText(/iOS Home Screen|Pantalla de Inicio iOS/i)
    ).toBeVisible()
    await expect(page.getByText(/Android/i).first()).toBeVisible()
    await expect(
      page.getByText(/Windows Tile|Tile de Windows/i)
    ).toBeVisible()
    await expect(
      page.getByText(/Bookmark Bar|Barra de Marcadores/i)
    ).toBeVisible()
    await expect(
      page.getByText(/PWA Install|Instalacion PWA/i)
    ).toBeVisible()

    // Verify PREMIUM badges appear on premium previews only (4 total)
    // Look for badges specifically within the preview grid
    const previewGrid = page.locator('main > div').nth(1)
    const premiumBadges = previewGrid.locator('span').filter({ hasText: /^PREMIUM$/i })
    await expect(premiumBadges).toHaveCount(4)

    // Verify free previews don't have PREMIUM badge
    // Browser Tab card should not have badge
    const browserTabCard = page
      .locator('div.border-8')
      .filter({ hasText: /Browser Tab|Pestana del Navegador/ })
    await expect(browserTabCard.getByText(/PREMIUM/i)).not.toBeVisible()

    // Bookmark card should not have badge
    const bookmarkCard = page
      .locator('div.border-8')
      .filter({ hasText: /Bookmark Bar|Barra de Marcadores/ })
    await expect(bookmarkCard.getByText(/PREMIUM/i)).not.toBeVisible()
  })

  test('should show preview cards with correct favicon images', async ({
    page,
  }) => {
    // Upload valid image on /upload
    await page.goto('/upload')
    const fileInput = await page.locator('input[type="file"]')
    const validImagePath = path.join(
      __dirname,
      '../fixtures/images/valid-512x512.png'
    )
    await fileInput.setInputFiles(validImagePath)

    // Wait for validation
    await page.waitForTimeout(500)

    // Click Continue
    const continueButton = page.getByRole('button', { name: /Continue|Continuar/i })
    await continueButton.click()

    // Wait for navigation and generation
    await page.waitForURL('**/preview', { timeout: 5000 })
    await page.waitForTimeout(2000)

    // Verify favicon images are present in preview cards
    const faviconImages = page.locator('img[alt*="favicon"]')
    await expect(faviconImages.first()).toBeVisible()

    // Verify premium previews have blur effect
    const iosCard = page.locator('div.blur-\\[4px\\]').first()
    await expect(iosCard).toBeVisible()
  })

  test('should navigate back to /upload when clicking Back button', async ({
    page,
  }) => {
    // Upload and navigate to preview
    await page.goto('/upload')
    const fileInput = await page.locator('input[type="file"]')
    const validImagePath = path.join(
      __dirname,
      '../fixtures/images/valid-512x512.png'
    )
    await fileInput.setInputFiles(validImagePath)
    await page.waitForTimeout(500)

    const continueButton = page.getByRole('button', { name: /Continue/i })
    await continueButton.click()
    await page.waitForURL('**/preview', { timeout: 5000 })

    // Click Back button
    const backButton = page.getByRole('button', { name: /Back|Atras/i })
    await backButton.click()

    // Should be redirected to /upload
    await page.waitForURL('**/upload', { timeout: 5000 })
    expect(page.url()).toContain('/upload')
  })

  test('should navigate to /download when clicking Download button', async ({
    page,
  }) => {
    // Upload and navigate to preview
    await page.goto('/upload')
    const fileInput = await page.locator('input[type="file"]')
    const validImagePath = path.join(
      __dirname,
      '../fixtures/images/valid-512x512.png'
    )
    await fileInput.setInputFiles(validImagePath)
    await page.waitForTimeout(500)

    const continueButton = page.getByRole('button', { name: /Continue/i })
    await continueButton.click()
    await page.waitForURL('**/preview', { timeout: 5000 })

    // Click Download button
    const downloadButton = page.getByRole('button', {
      name: /Download|Descargar/i,
    })
    await downloadButton.click()

    // Should navigate to /download
    await page.waitForURL('**/download', { timeout: 5000 })
    expect(page.url()).toContain('/download')
  })

  test('should preserve source image in IndexedDB', async ({
    page,
  }) => {
    // Upload and navigate to preview
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

    // Verify source image is in IndexedDB
    await waitForSourceImageInIDB(page)

    // Go back to upload
    const backButton = page.getByRole('button', { name: /Back|Atras/i })
    await backButton.click()
    await page.waitForURL('**/upload', { timeout: 5000 })

    // Verify source image is still in IndexedDB after navigation
    await waitForSourceImageInIDB(page)
  })

  test('should show info box with correct content', async ({ page }) => {
    // Upload and navigate to preview
    await page.goto('/upload')
    const fileInput = await page.locator('input[type="file"]')
    const validImagePath = path.join(
      __dirname,
      '../fixtures/images/valid-512x512.png'
    )
    await fileInput.setInputFiles(validImagePath)
    await page.waitForTimeout(500)

    const continueButton = page.getByRole('button', { name: /Continue/i })
    await continueButton.click()
    await page.waitForURL('**/preview', { timeout: 5000 })
    await page.waitForTimeout(2000)

    // Verify info box is present
    await expect(page.getByText(/Looks Good?|Se Ve Bien?/i)).toBeVisible()
    await expect(
      page.getByText(
        /These previews show|Estas vistas previas muestran/i
      )
    ).toBeVisible()
  })
})
