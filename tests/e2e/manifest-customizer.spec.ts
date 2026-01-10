import { test, expect } from '../fixtures/app.fixture'
import { FIXTURES } from '../fixtures'
import { resetDatabase, executeSQL } from '../helpers/db'
import { createAuthSession, setAuthCookie } from '../helpers/auth'
import path from 'path'
import { fileURLToPath } from 'url'
import { waitForFaviconCacheInIDB } from './helpers/indexeddb'
import JSZip from 'jszip'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

test.describe('Manifest Customizer', () => {
  test.beforeEach(async ({ dbContext }) => {
    await resetDatabase(dbContext)
  })

  test('premium user can customize manifest and download ZIP with custom values', async ({
    page,
    context,
    appServer,
    dbContext,
  }) => {
    // 1. Authenticate and make user premium
    const baseUrl = `http://localhost:${appServer.port}`
    const { token } = await createAuthSession(baseUrl, {
      email: FIXTURES.users.alice.email,
      password: 'password123',
    })
    await setAuthCookie(context, token)

    await executeSQL(
      dbContext,
      'UPDATE users SET is_premium = true, premium_since = now() WHERE email = $1',
      [FIXTURES.users.alice.email]
    )

    // 2. Upload valid image
    await page.goto('/upload')
    const fileInput = await page.locator('input[type="file"]')
    const validImagePath = path.join(
      __dirname,
      '../fixtures/images/valid-512x512.png'
    )
    await fileInput.setInputFiles(validImagePath)
    await page.waitForTimeout(500)

    const continueButton = page.getByRole('button', {
      name: /Continue|Continuar/i,
    })
    await continueButton.click()

    await page.waitForURL('**/preview', { timeout: 5000 })
    await page.waitForTimeout(2000)
    await waitForFaviconCacheInIDB(page)

    // 3. Navigate to download
    const downloadNavButton = page.getByRole('button', {
      name: /Download|Descargar/i,
    })
    await downloadNavButton.click()
    await page.waitForURL('**/download', { timeout: 5000 })

    // 4. Premium package should be selected by default
    await expect(page.getByRole('button', { name: /€5/ })).toBeVisible()

    // 5. Verify ManifestCustomizer is visible
    await expect(
      page.getByText(/Customize Your PWA|Personaliza tu PWA/i)
    ).toBeVisible()

    // 6. Fill in custom values
    await page.fill('#manifest-app-name', 'Test Custom App')
    await page.fill('#manifest-short-name', 'TestApp')
    await page.fill('#manifest-theme-color', '#ff5500')
    await page.fill('#manifest-background-color', '#0055ff')

    // 7. Trigger download
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 })
    const downloadPremiumButton = page.getByRole('button', {
      name: /Download Premium|Descargar Premium/i,
    })
    await downloadPremiumButton.click()

    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/faviconforge-\d+\.zip/)

    // 8. Extract and verify manifest.json contents
    const downloadPath = await download.path()
    if (!downloadPath) {
      throw new Error('Download path is null')
    }

    const fs = await import('fs')
    const zipBuffer = fs.readFileSync(downloadPath)
    const zip = await JSZip.loadAsync(zipBuffer)

    const manifestFile = zip.file('manifest.json')
    expect(manifestFile).toBeTruthy()

    const manifestContent = await manifestFile!.async('text')
    const manifest = JSON.parse(manifestContent)

    expect(manifest.name).toBe('Test Custom App')
    expect(manifest.short_name).toBe('TestApp')
    expect(manifest.theme_color).toBe('#ff5500')
    expect(manifest.background_color).toBe('#0055ff')
  })

  test('ManifestCustomizer is hidden for non-premium users', async ({
    page,
    context,
    appServer,
  }) => {
    // 1. Authenticate (but don't make premium)
    const baseUrl = `http://localhost:${appServer.port}`
    const { token } = await createAuthSession(baseUrl, {
      email: FIXTURES.users.alice.email,
      password: 'password123',
    })
    await setAuthCookie(context, token)

    // 2. Upload valid image
    await page.goto('/upload')
    const fileInput = await page.locator('input[type="file"]')
    const validImagePath = path.join(
      __dirname,
      '../fixtures/images/valid-512x512.png'
    )
    await fileInput.setInputFiles(validImagePath)
    await page.waitForTimeout(500)

    const continueButton = page.getByRole('button', {
      name: /Continue|Continuar/i,
    })
    await continueButton.click()

    await page.waitForURL('**/preview', { timeout: 5000 })
    await page.waitForTimeout(2000)
    await waitForFaviconCacheInIDB(page)

    // 3. Navigate to download
    const downloadNavButton = page.getByRole('button', {
      name: /Download|Descargar/i,
    })
    await downloadNavButton.click()
    await page.waitForURL('**/download', { timeout: 5000 })

    // 4. Select premium package
    await page.getByRole('button', { name: /€5/ }).click()

    // 5. ManifestCustomizer should NOT be visible
    await expect(
      page.getByText(/Customize Your PWA|Personaliza tu PWA/i)
    ).not.toBeVisible()

    // 6. Buy Premium button should be visible instead
    await expect(
      page.getByRole('button', { name: /Buy Premium|Comprar Premium/i })
    ).toBeVisible()
  })

  test('ManifestCustomizer is hidden when free tier is selected', async ({
    page,
    context,
    appServer,
    dbContext,
  }) => {
    // 1. Authenticate and make user premium
    const baseUrl = `http://localhost:${appServer.port}`
    const { token } = await createAuthSession(baseUrl, {
      email: FIXTURES.users.alice.email,
      password: 'password123',
    })
    await setAuthCookie(context, token)

    await executeSQL(
      dbContext,
      'UPDATE users SET is_premium = true, premium_since = now() WHERE email = $1',
      [FIXTURES.users.alice.email]
    )

    // 2. Upload valid image
    await page.goto('/upload')
    const fileInput = await page.locator('input[type="file"]')
    const validImagePath = path.join(
      __dirname,
      '../fixtures/images/valid-512x512.png'
    )
    await fileInput.setInputFiles(validImagePath)
    await page.waitForTimeout(500)

    const continueButton = page.getByRole('button', {
      name: /Continue|Continuar/i,
    })
    await continueButton.click()

    await page.waitForURL('**/preview', { timeout: 5000 })
    await page.waitForTimeout(2000)
    await waitForFaviconCacheInIDB(page)

    // 3. Navigate to download
    const downloadNavButton = page.getByRole('button', {
      name: /Download|Descargar/i,
    })
    await downloadNavButton.click()
    await page.waitForURL('**/download', { timeout: 5000 })

    // 4. Select FREE package
    await page.getByRole('button', { name: /€0/ }).click()

    // 5. ManifestCustomizer should NOT be visible
    await expect(
      page.getByText(/Customize Your PWA|Personaliza tu PWA/i)
    ).not.toBeVisible()
  })

  test('default values are used when no customization is made', async ({
    page,
    context,
    appServer,
    dbContext,
  }) => {
    // 1. Authenticate and make user premium
    const baseUrl = `http://localhost:${appServer.port}`
    const { token } = await createAuthSession(baseUrl, {
      email: FIXTURES.users.alice.email,
      password: 'password123',
    })
    await setAuthCookie(context, token)

    await executeSQL(
      dbContext,
      'UPDATE users SET is_premium = true, premium_since = now() WHERE email = $1',
      [FIXTURES.users.alice.email]
    )

    // 2. Upload valid image
    await page.goto('/upload')
    const fileInput = await page.locator('input[type="file"]')
    const validImagePath = path.join(
      __dirname,
      '../fixtures/images/valid-512x512.png'
    )
    await fileInput.setInputFiles(validImagePath)
    await page.waitForTimeout(500)

    const continueButton = page.getByRole('button', {
      name: /Continue|Continuar/i,
    })
    await continueButton.click()

    await page.waitForURL('**/preview', { timeout: 5000 })
    await page.waitForTimeout(2000)
    await waitForFaviconCacheInIDB(page)

    // 3. Navigate to download
    const downloadNavButton = page.getByRole('button', {
      name: /Download|Descargar/i,
    })
    await downloadNavButton.click()
    await page.waitForURL('**/download', { timeout: 5000 })

    // 4. Premium package should be selected
    await expect(page.getByRole('button', { name: /€5/ })).toBeVisible()

    // 5. ManifestCustomizer should be visible with default values
    await expect(
      page.getByText(/Customize Your PWA|Personaliza tu PWA/i)
    ).toBeVisible()

    // 6. DO NOT change any values - just download with defaults

    // 7. Trigger download
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 })
    const downloadPremiumButton = page.getByRole('button', {
      name: /Download Premium|Descargar Premium/i,
    })
    await downloadPremiumButton.click()

    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/faviconforge-\d+\.zip/)

    // 8. Extract and verify manifest.json has default values
    const downloadPath = await download.path()
    if (!downloadPath) {
      throw new Error('Download path is null')
    }

    const fs = await import('fs')
    const zipBuffer = fs.readFileSync(downloadPath)
    const zip = await JSZip.loadAsync(zipBuffer)

    const manifestFile = zip.file('manifest.json')
    expect(manifestFile).toBeTruthy()

    const manifestContent = await manifestFile!.async('text')
    const manifest = JSON.parse(manifestContent)

    expect(manifest.name).toBe('My App')
    expect(manifest.short_name).toBe('App')
    expect(manifest.theme_color).toBe('#ffffff')
    expect(manifest.background_color).toBe('#ffffff')
  })
})
