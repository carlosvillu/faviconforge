import { test, expect } from '../fixtures/app.fixture'

test.describe('Authentication', () => {
  test('should display Google OAuth button on signup page', async ({ page }) => {
    await page.goto('/auth/signup')
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible()
  })

  test('should display Google OAuth button on login page', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible()
  })

  test('should render info callout on login for oauth no-account error', async ({ page }) => {
    await page.goto('/auth/login?error=user_not_found')
    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page.getByText(/no account found/i)).toBeVisible()
    await expect(page.getByRole('alert').getByRole('link', { name: /sign up/i })).toBeVisible()
  })
})
