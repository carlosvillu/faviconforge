import { test, expect } from '../fixtures/app.fixture'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

test.describe('Upload Page', () => {
  test('should render upload page correctly', async ({ page }) => {
    await page.goto('/upload')

    // Verify header with step indicator
    await expect(page.getByText(/STEP 1\/3: UPLOAD|PASO 1\/3: UPLOAD/i)).toBeVisible()
    const header = await page.locator('header')
    await expect(header).toBeVisible()
    await expect(header).toHaveClass(/bg-yellow-300/)

    // Verify progress bar
    const progressBar = await page.locator('div.bg-black.h-4')
    await expect(progressBar).toBeVisible()

    // Verify dropzone
    await expect(page.getByText(/DRAG & DROP|ARRASTRA Y SUELTA/i)).toBeVisible()

    // Verify requirements section
    await expect(page.getByText(/Image Requirements:|Requisitos de Imagen:/i)).toBeVisible()
    await expect(page.getByText(/Square aspect ratio|Relacion de aspecto cuadrada/i)).toBeVisible()
    await expect(page.getByText(/Minimum 512×512 pixels|Minimo 512×512 pixeles/i)).toBeVisible()

    // Verify footer
    const footer = await page.locator('footer')
    await expect(footer).toBeVisible()
    await expect(footer).toHaveClass(/bg-black/)
  })

  test('should show success state with valid PNG', async ({ page }) => {
    await page.goto('/upload')

    // Upload valid PNG
    const fileInput = await page.locator('input[type="file"]')
    const validImagePath = path.join(
      __dirname,
      '../fixtures/images/valid-512x512.png'
    )
    await fileInput.setInputFiles(validImagePath)

    // Wait for validation to complete
    await page.waitForTimeout(500)

    // Verify success message
    await expect(page.getByText(/FILE UPLOADED!/i)).toBeVisible()
    await expect(page.getByText(/valid-512x512.png/i)).toBeVisible()

    // Verify Continue button is present
    const continueButton = page.getByRole('button', { name: /Continue/i })
    await expect(continueButton).toBeVisible()

    // Verify Choose Different button is present
    const chooseDifferentButton = page.getByRole('button', {
      name: /Choose Different/i,
    })
    await expect(chooseDifferentButton).toBeVisible()
  })

  test('should show error for invalid format', async ({ page }) => {
    await page.goto('/upload')

    // Upload GIF file
    const fileInput = await page.locator('input[type="file"]')
    const invalidImagePath = path.join(
      __dirname,
      '../fixtures/images/invalid-format.gif'
    )
    await fileInput.setInputFiles(invalidImagePath)

    // Wait for validation to complete
    await page.waitForTimeout(500)

    // Verify error message
    await expect(page.getByText(/ERROR/i)).toBeVisible()
    await expect(
      page.getByText(/Invalid image format|Formato de imagen no válido/i)
    ).toBeVisible()

    // Verify Try Again button
    const tryAgainButton = page.getByRole('button', { name: /Try Again|Intentar de Nuevo/i })
    await expect(tryAgainButton).toBeVisible()
  })

  test('should show error for non-square image', async ({ page }) => {
    await page.goto('/upload')

    // Upload non-square PNG (1024x512 - both dimensions >= 512 but not square)
    const fileInput = await page.locator('input[type="file"]')
    const nonSquareImagePath = path.join(
      __dirname,
      '../fixtures/images/non-square-1024x512.png'
    )
    await fileInput.setInputFiles(nonSquareImagePath)

    // Wait for validation to complete
    await page.waitForTimeout(1500)

    // Verify error message about aspect ratio
    await expect(page.getByText(/ERROR/i)).toBeVisible()
    await expect(
      page.getByText(/must be square|debe ser cuadrada|same width and height|mismo ancho y alto/i)
    ).toBeVisible()
  })

  test('should show error for too small image', async ({ page }) => {
    await page.goto('/upload')

    // Upload too small PNG
    const fileInput = await page.locator('input[type="file"]')
    const smallImagePath = path.join(
      __dirname,
      '../fixtures/images/too-small-200x200.png'
    )
    await fileInput.setInputFiles(smallImagePath)

    // Wait for validation to complete
    await page.waitForTimeout(500)

    // Verify error message about minimum size
    await expect(page.getByText(/ERROR/i)).toBeVisible()
    await expect(
      page.getByText(/too small|demasiado pequeña/i)
    ).toBeVisible()
  })

  test('should store image and navigate on continue', async ({ page }) => {
    await page.goto('/upload')

    // Upload valid PNG
    const fileInput = await page.locator('input[type="file"]')
    const validImagePath = path.join(
      __dirname,
      '../fixtures/images/valid-512x512.png'
    )
    await fileInput.setInputFiles(validImagePath)

    // Wait for validation
    await page.waitForTimeout(500)

    // Click Continue button
    const continueButton = page.getByRole('button', { name: /Continue/i })
    await continueButton.click()

    // Wait for navigation
    await page.waitForURL('**/preview', { timeout: 5000 })

    // Verify we're on the preview page
    expect(page.url()).toContain('/preview')

    // Verify sessionStorage has the image data
    const sessionData = await page.evaluate(() =>
      sessionStorage.getItem('faviconforge_source_image')
    )
    expect(sessionData).toBeTruthy()
    expect(sessionData).toContain('data:image/')
  })

  test('should reset state when clicking Try Again', async ({ page }) => {
    await page.goto('/upload')

    // Upload invalid GIF
    const fileInput = await page.locator('input[type="file"]')
    const invalidImagePath = path.join(
      __dirname,
      '../fixtures/images/invalid-format.gif'
    )
    await fileInput.setInputFiles(invalidImagePath)

    // Wait for validation
    await page.waitForTimeout(500)

    // Verify error is shown
    await expect(page.getByText(/ERROR/i)).toBeVisible()

    // Click Try Again
    const tryAgainButton = page.getByRole('button', { name: /Try Again|Intentar de Nuevo/i })
    await tryAgainButton.click()

    // Verify we're back to idle state
    await expect(page.getByText(/DRAG & DROP/i)).toBeVisible()
  })
})
