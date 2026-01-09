import { test, expect } from '../fixtures/app.fixture'
import { FIXTURES } from '../fixtures'
import { resetDatabase } from '../helpers/db'
import { createAuthSession, setAuthCookie } from '../helpers/auth'
import path from 'path'
import { fileURLToPath } from 'url'
import { waitForFaviconCacheInIDB } from './helpers/indexeddb'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

test.describe('Checkout Flow', () => {
    test.beforeEach(async ({ dbContext }) => {
        await resetDatabase(dbContext)
    })

    test('logged-in user can initiate checkout', async ({ page, context, appServer }) => {
        // 0. Create user and session via Better Auth API
        const baseUrl = `http://localhost:${appServer.port}`
        const { token } = await createAuthSession(baseUrl, {
            email: FIXTURES.users.alice.email,
            password: 'password123',
        })
        await setAuthCookie(context, token)

        // 1. Mock the checkout API
        await page.route('/api/stripe/checkout', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ url: 'https://checkout.stripe.com/mock-session' }),
            })
        })

        // 3. Upload image first (required for download page)
        await page.goto('/upload')
        const fileInput = await page.locator('input[type="file"]')
        const validImagePath = path.join(
            __dirname,
            '../fixtures/images/valid-512x512.png'
        )
        await fileInput.setInputFiles(validImagePath)

        // Wait for button enablement
        await page.waitForTimeout(500)

        const continueButton = page.getByRole('button', { name: /Continue|Continuar/i })
        await continueButton.click()

        await page.waitForURL('**/preview', { timeout: 10000 })
        await page.waitForTimeout(2000) // Wait for generation
        await waitForFaviconCacheInIDB(page)

        // 4. Navigate to download page
        const downloadNavButton = page.getByRole('button', { name: /Download|Descargar/i })
        await downloadNavButton.click()
        await page.waitForURL('**/download', { timeout: 5000 })

        // 5. Select Premium tier
        await page.getByRole('button', { name: /€5/ }).click()

        // 6. Click Buy Premium
        const buyButton = page.getByRole('button', { name: /Buy Premium|Comprar Premium/i })
        await expect(buyButton).toBeEnabled()

        const requestPromise = page.waitForRequest(
            (req) => req.url().includes('/api/stripe/checkout') && req.method() === 'POST'
        )

        await buyButton.click()

        // Verify the checkout request was made
        const request = await requestPromise
        expect(request).toBeTruthy()

        // Verify navigation to Stripe checkout URL
        await page.waitForURL('**/checkout.stripe.com/**', { timeout: 10000 })
    })

    test('checkout error handling', async ({ page, context, appServer }) => {
        // 0. Create user and session via Better Auth API
        const baseUrl = `http://localhost:${appServer.port}`
        const { token } = await createAuthSession(baseUrl, {
            email: FIXTURES.users.alice.email,
            password: 'password123',
        })
        await setAuthCookie(context, token)

        // 1. Mock the checkout API to fail
        await page.route('/api/stripe/checkout', async (route) => {
            await route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ error: 'Internal Server Error' }),
            })
        })

        // 3. Upload image and navigate to download
        await page.goto('/upload')
        const fileInput = await page.locator('input[type="file"]')
        const validImagePath = path.join(
            __dirname,
            '../fixtures/images/valid-512x512.png'
        )
        await fileInput.setInputFiles(validImagePath)
        await page.waitForTimeout(500)
        await page.getByRole('button', { name: /Continue|Continuar/i }).click()
        await page.waitForURL('**/preview', { timeout: 10000 })
        await page.waitForTimeout(2000)
        await waitForFaviconCacheInIDB(page)
        await page.getByRole('button', { name: /Download|Descargar/i }).click()
        await page.waitForURL('**/download')

        // 4. Trigger error
        await page.getByRole('button', { name: /€5/ }).click()
        const buyButton = page.getByRole('button', { name: /Buy Premium|Comprar Premium/i })
        await buyButton.click()

        // 5. Verify error toast
        await expect(page.getByText(/Error starting checkout|Error al iniciar el pago/i)).toBeVisible()

        // Button should be reset (not loading)
        await expect(page.getByText(/Buy Premium|Comprar Premium/i)).toBeVisible()
        await expect(page.getByText(/Redirecting to Stripe|Redirigiendo a Stripe/i)).not.toBeVisible()
    })
})
