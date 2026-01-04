import { test, expect } from '../fixtures/app.fixture'

test.describe('Landing Page', () => {
  test('should render hero section correctly', async ({ page }) => {
    await page.goto('/')

    // Verify hero headline is visible
    const heroHeadline = page.getByRole('heading', {
      level: 2,
      name: /generate.*all.*favicon.*formats/i,
    })
    await expect(heroHeadline).toBeVisible()

    // Verify "Upload Image" button is visible and links to /upload
    const uploadButton = page.getByRole('button', { name: /upload image/i })
    await expect(uploadButton).toBeVisible()

    const uploadLink = page.getByRole('link', { name: /upload image/i })
    await expect(uploadLink).toHaveAttribute('href', '/upload')
  })

  test('should display features section', async ({ page }) => {
    await page.goto('/')

    // Scroll to features section
    const featuresTitle = page.getByRole('heading', {
      level: 3,
      name: /why faviconforge/i,
    })
    await featuresTitle.scrollIntoViewIfNeeded()

    // Verify "Why FaviconForge?" title is visible
    await expect(featuresTitle).toBeVisible()

    // Verify 6 feature cards are displayed
    const featureCards = page.locator('section').filter({ hasText: /why faviconforge/i })
      .locator('div.border-4.border-yellow-300')
    await expect(featureCards).toHaveCount(6)
  })

  test('should display pricing section with both tiers', async ({ page }) => {
    await page.goto('/')

    // Scroll to pricing section
    const pricingTitle = page.getByRole('heading', {
      level: 3,
      name: /pricing/i,
    })
    await pricingTitle.scrollIntoViewIfNeeded()

    // Verify free tier card shows €0 (more specific selector with border-8)
    const freeTier = page.locator('div.border-8.border-black.bg-yellow-300').filter({ hasText: /free/i })
    await expect(freeTier).toBeVisible()
    await expect(freeTier.getByText('€0')).toBeVisible()

    // Verify free tier has "Start Free" button
    const freeButton = freeTier.getByRole('button', { name: /start free/i })
    await expect(freeButton).toBeVisible()

    // Verify premium tier card shows €5
    const premiumTier = page.locator('div.border-8.border-black.bg-black.text-yellow-300').filter({ hasText: /premium/i })
    await expect(premiumTier).toBeVisible()
    await expect(premiumTier.getByText('€5')).toBeVisible()

    // Verify premium tier has "Buy Premium" button
    const premiumButton = premiumTier.getByRole('button', { name: /buy premium/i })
    await expect(premiumButton).toBeVisible()

    // Verify "POPULAR" badge is visible on premium card
    await expect(premiumTier.getByText(/popular/i)).toBeVisible()
  })

  test('should navigate to upload page when clicking Upload CTA', async ({ page }) => {
    await page.goto('/')

    // Click "Upload Image" button in hero
    const uploadButton = page.getByRole('link', { name: /upload image/i }).first()
    await uploadButton.click()

    // Verify URL changed to /upload
    await page.waitForURL('/upload')

    // Verify upload page is displayed
    const uploadPageTitle = page.getByRole('heading', { name: /upload your.*image/i })
    await expect(uploadPageTitle).toBeVisible()
  })

  test('should render footer links', async ({ page }) => {
    await page.goto('/')

    // Scroll to footer
    const footer = page.locator('footer')
    await footer.scrollIntoViewIfNeeded()

    // Verify "Terms of Service" link is visible
    const termsLink = page.getByRole('link', { name: /terms of service/i })
    await expect(termsLink).toBeVisible()
    await expect(termsLink).toHaveAttribute('href', '/terms')

    // Verify "Privacy Policy" link is visible
    const privacyLink = page.getByRole('link', { name: /privacy policy/i })
    await expect(privacyLink).toBeVisible()
    await expect(privacyLink).toHaveAttribute('href', '/privacy')

    // Verify "Contact" link is visible
    const contactLink = page.getByRole('link', { name: /contact/i })
    await expect(contactLink).toBeVisible()
    await expect(contactLink).toHaveAttribute('href', '/contact')

    // Verify copyright text is visible
    await expect(footer.getByText(/© 2025 FAVICONFORGE/i)).toBeVisible()
  })
})
