import { test, expect } from '../fixtures/app.fixture'
import { FIXTURES } from '../fixtures'
import { resetDatabase, executeSQL } from '../helpers/db'
import { createAuthSession, setAuthCookie } from '../helpers/auth'
import path from 'path'
import { fileURLToPath } from 'url'
import { waitForFaviconCacheInIDB } from './helpers/indexeddb'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

test.describe('Success Page', () => {
    test.beforeEach(async ({ dbContext }) => {
        await resetDatabase(dbContext)
    })

    test('authenticated user is redirected to download and triggers auto-download', async ({
        page,
        context,
        appServer,
        dbContext,
    }) => {
        // 1. Authenticate
        const baseUrl = `http://localhost:${appServer.port}`
        const { token } = await createAuthSession(baseUrl, {
            email: FIXTURES.users.alice.email,
            password: 'password123',
        })
        await setAuthCookie(context, token)

        // 2. Make Alice premium
        await executeSQL(
            dbContext,
            'UPDATE users SET is_premium = true, premium_since = now() WHERE email = $1',
            [FIXTURES.users.alice.email]
        )

        // 3. Upload image (prerequisite for download page)
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

        // 4. Navigate to /success and setup download listener
        const downloadPromise = page.waitForEvent('download', { timeout: 25000 })
        await page.goto('/success')

        // 5. Verify Welcome Message
        await expect(page.getByRole('heading', { name: /Welcome to Premium/i })).toBeVisible()
        await expect(page.getByText(/You now have lifetime access/i)).toBeVisible()
        await expect(page.getByText(/Redirecting you/i)).toBeVisible()

        // 6. Wait for auto-redirect
        await page.waitForTimeout(3500)
        await page.waitForURL('**/download?autoDownload=true', { timeout: 5000 })

        // 7. Verify we are on download page with autoDownload query param
        expect(page.url()).toContain('/download?autoDownload=true')

        // 8. Verify download is triggered (Premium ZIP)
        const download = await downloadPromise
        expect(download.suggestedFilename()).toContain('.zip')
    })

    test('authenticated user (non-premium) does NOT auto-download if not premium', async ({
        page,
        context,
        appServer,
    }) => {
        // 1. Authenticate (alice is free tier by default)
        const baseUrl = `http://localhost:${appServer.port}`
        const { token } = await createAuthSession(baseUrl, {
            email: FIXTURES.users.alice.email,
            password: 'password123',
        })
        await setAuthCookie(context, token)

        // 2. Upload image
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

        // 3. Navigate to /success and wait for redirect
        await page.goto('/success')
        await page.waitForURL('**/download?autoDownload=true', { timeout: 6000 })

        // 4. Expect NO download (wait a bit to ensure download doesn't trigger)
        let downloadOccurred = false
        page.on('download', () => {
            downloadOccurred = true
        })
        await page.waitForTimeout(3000)
        expect(downloadOccurred).toBe(false)
    })

    test('unauthenticated user is redirected to login', async ({ page }) => {
        await page.goto('/success')
        await expect(page).toHaveURL(/\/auth\/login/)
    })
})
