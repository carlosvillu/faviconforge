import { test, expect } from '../fixtures/app.fixture'

test.describe('Privacy Policy', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().addCookies([
      {
        name: 'lang',
        value: 'en',
        domain: 'localhost',
        path: '/',
      },
    ])
  })

  test('should load privacy page correctly (default EN)', async ({ page }) => {
    await page.goto('/privacy')

    await expect(
      page.getByRole('heading', { level: 1, name: /privacy policy/i })
    ).toBeVisible()

    await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible()
  })

  test('should render privacy page in Spanish when lang cookie is set', async ({
    page,
  }) => {
    await page.context().addCookies([
      {
        name: 'lang',
        value: 'es',
        domain: 'localhost',
        path: '/',
      },
    ])

    await page.goto('/privacy')

    await expect(
      page.getByRole('heading', { level: 1, name: /política de privacidad/i })
    ).toBeVisible()
  })

  test('should navigate to privacy page from footer link', async ({ page }) => {
    await page.goto('/')

    const footer = page.locator('footer')
    await footer.scrollIntoViewIfNeeded()

    const privacyLink = page.getByRole('link', { name: /privacy policy/i })
    await privacyLink.click()

    await page.waitForURL('/privacy')

    await expect(
      page.getByRole('heading', { level: 1, name: /privacy policy/i })
    ).toBeVisible()
  })
})
