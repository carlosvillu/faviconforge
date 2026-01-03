import { test, expect, seedUser } from '../fixtures'
import { resetDatabase } from '../helpers/db'
import { randomUUID } from 'crypto'

test.describe('Premium service', () => {
  test.beforeEach(async ({ dbContext }) => {
    await resetDatabase(dbContext)
  })

  test('user is not premium by default', async ({
    request,
    appServer,
    dbContext,
  }) => {
    const userId = await seedUser(dbContext, 'alice')
    const baseUrl = `http://localhost:${appServer.port}`

    const response = await request.get(
      `${baseUrl}/api/__test__/premium?userId=${userId}`
    )
    expect(response.ok()).toBe(true)

    const status = await response.json()
    expect(status.isPremium).toBe(false)
    expect(status.premiumSince).toBeNull()
  })

  test('grantPremium makes user premium', async ({
    request,
    appServer,
    dbContext,
  }) => {
    const userId = await seedUser(dbContext, 'alice')
    const baseUrl = `http://localhost:${appServer.port}`

    // Grant premium
    const grantResponse = await request.post(
      `${baseUrl}/api/__test__/premium`,
      {
        data: { userId, stripeCustomerId: 'cus_test123' },
      }
    )
    expect(grantResponse.ok()).toBe(true)

    // Verify status
    const statusResponse = await request.get(
      `${baseUrl}/api/__test__/premium?userId=${userId}`
    )
    const status = await statusResponse.json()
    expect(status.isPremium).toBe(true)
    expect(status.premiumSince).not.toBeNull()
  })

  test('grantPremium is idempotent', async ({
    request,
    appServer,
    dbContext,
  }) => {
    const userId = await seedUser(dbContext, 'alice')
    const baseUrl = `http://localhost:${appServer.port}`

    // First grant
    await request.post(`${baseUrl}/api/__test__/premium`, {
      data: { userId, stripeCustomerId: 'cus_1' },
    })

    // Get the premiumSince timestamp
    const firstStatusResponse = await request.get(
      `${baseUrl}/api/__test__/premium?userId=${userId}`
    )
    const firstStatus = await firstStatusResponse.json()
    const originalPremiumSince = firstStatus.premiumSince

    // Second grant with different stripeCustomerId
    await request.post(`${baseUrl}/api/__test__/premium`, {
      data: { userId, stripeCustomerId: 'cus_2' },
    })

    // Verify premiumSince unchanged (idempotent)
    const secondStatusResponse = await request.get(
      `${baseUrl}/api/__test__/premium?userId=${userId}`
    )
    const secondStatus = await secondStatusResponse.json()
    expect(secondStatus.isPremium).toBe(true)
    expect(secondStatus.premiumSince).toBe(originalPremiumSince)
  })

  test('getPremiumStatus returns defaults for non-existent user', async ({
    request,
    appServer,
  }) => {
    const randomUserId = randomUUID()
    const baseUrl = `http://localhost:${appServer.port}`

    const response = await request.get(
      `${baseUrl}/api/__test__/premium?userId=${randomUserId}`
    )
    expect(response.ok()).toBe(true)

    const status = await response.json()
    expect(status.isPremium).toBe(false)
    expect(status.premiumSince).toBeNull()
  })
})
