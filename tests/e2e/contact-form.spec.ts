import { test, expect } from '../fixtures/app.fixture'

test.describe('Contact Form', () => {
  test.beforeEach(async ({ request, appServer }) => {
    // Clear test state before each test
    const baseUrl = `http://localhost:${appServer.port}`
    await request.delete(`${baseUrl}/api/__test__/contact`)
  })

  test('should load contact page correctly', async ({ page }) => {
    await page.goto('/contact')

    // Verify page title is visible
    const heading = page.getByRole('heading', { level: 1, name: /contact us/i })
    await expect(heading).toBeVisible()

    // Verify form has name, email, and message fields
    await expect(page.getByLabel(/name/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/message/i)).toBeVisible()

    // Verify send button is visible
    await expect(
      page.getByRole('button', { name: /send message/i })
    ).toBeVisible()
  })

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.goto('/contact')

    // Click send button without filling any fields
    await page.getByRole('button', { name: /send message/i }).click()

    // Verify form shows validation errors (with timeout for async validation)
    await expect(page.getByText(/name is required/i)).toBeVisible({
      timeout: 10000,
    })
    await expect(page.getByText(/invalid email/i)).toBeVisible({
      timeout: 10000,
    })
    await expect(
      page.getByText(/message must be at least 10 characters/i)
    ).toBeVisible({ timeout: 10000 })
  })

  test('should show validation error for invalid email', async ({ page }) => {
    await page.goto('/contact')

    // Wait for the form to be ready
    await expect(page.getByLabel(/name/i)).toBeVisible()

    // Fill form with name and message but leave email empty
    await page.getByLabel(/name/i).fill('Test User')
    // Leave email empty - it should show "Invalid email" error
    await page
      .getByLabel(/message/i)
      .fill('This is a test message for the contact form')

    // Click send button
    await page.getByRole('button', { name: /send message/i }).click()

    // Verify email validation error (with timeout for async validation)
    await expect(page.getByText(/invalid email/i)).toBeVisible({
      timeout: 10000,
    })
  })

  test('should show validation error for message too short', async ({
    page,
  }) => {
    await page.goto('/contact')

    // Fill form with short message
    await page.getByLabel(/name/i).fill('Test User')
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel(/message/i).fill('Short')

    // Click send button
    await page.getByRole('button', { name: /send message/i }).click()

    // Verify message validation error (with timeout for async validation)
    await expect(
      page.getByText(/message must be at least 10 characters/i)
    ).toBeVisible({ timeout: 10000 })
  })

  test('should successfully submit form (mocked email)', async ({
    page,
    request,
    appServer,
  }) => {
    const baseUrl = `http://localhost:${appServer.port}`

    await page.goto('/contact')

    // Fill form with valid data
    await page.getByLabel(/name/i).fill('Test User')
    await page.getByLabel(/email/i).fill('test@example.com')
    await page
      .getByLabel(/message/i)
      .fill('This is a test message that is long enough to pass validation.')

    // Click send button
    await page.getByRole('button', { name: /send message/i }).click()

    // Wait for success toast or success state
    await expect(page.getByText(/thank you/i)).toBeVisible({ timeout: 10000 })

    // Verify mock email was stored
    const response = await request.get(`${baseUrl}/api/__test__/contact`)
    expect(response.ok()).toBe(true)

    const data = await response.json()
    expect(data.emails).toHaveLength(1)
    expect(data.emails[0].name).toBe('Test User')
    expect(data.emails[0].email).toBe('test@example.com')
    expect(data.emails[0].message).toBe(
      'This is a test message that is long enough to pass validation.'
    )
  })

  test('should show rate limit error after 3 submissions', async ({
    page,
    request,
    appServer,
  }) => {
    const baseUrl = `http://localhost:${appServer.port}`

    // Submit 3 times via API (faster than UI)
    for (let i = 0; i < 3; i++) {
      const response = await request.post(`${baseUrl}/api/contact`, {
        data: {
          name: `User ${i}`,
          email: `user${i}@example.com`,
          message: 'This is a test message that is long enough to pass.',
        },
      })
      expect(response.ok()).toBe(true)
    }

    // Now try to submit via UI - should be rate limited
    await page.goto('/contact')

    await page.getByLabel(/name/i).fill('Rate Limited User')
    await page.getByLabel(/email/i).fill('ratelimited@example.com')
    await page.getByLabel(/message/i).fill('This message should be rate limited.')

    await page.getByRole('button', { name: /send message/i }).click()

    // Wait for rate limit toast
    await expect(page.getByText(/too many messages/i)).toBeVisible({
      timeout: 10000,
    })
  })

  test('should navigate to contact page from footer link', async ({ page }) => {
    // Start on landing page
    await page.goto('/')

    // Scroll to footer and click contact link
    const footer = page.locator('footer')
    await footer.scrollIntoViewIfNeeded()

    const contactLink = page.getByRole('link', { name: /contact/i })
    await contactLink.click()

    // Verify navigation to contact page
    await page.waitForURL('/contact')

    // Verify contact form is visible
    await expect(
      page.getByRole('heading', { level: 1, name: /contact us/i })
    ).toBeVisible()
  })

  test('should allow sending another message after success', async ({
    page,
  }) => {
    await page.goto('/contact')

    // Fill and submit first message
    await page.getByLabel(/name/i).fill('Test User')
    await page.getByLabel(/email/i).fill('test@example.com')
    await page
      .getByLabel(/message/i)
      .fill('This is a test message that is long enough to pass validation.')

    await page.getByRole('button', { name: /send message/i }).click()

    // Wait for success state
    await expect(page.getByText(/thank you/i)).toBeVisible({ timeout: 10000 })

    // Click "Send Another Message" button
    await page.getByRole('button', { name: /send another message/i }).click()

    // Verify form is shown again
    await expect(page.getByLabel(/name/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/message/i)).toBeVisible()
  })
})
