import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { users } from '~/db/schema/users'

export type PremiumStatus = {
  isPremium: boolean
  premiumSince: Date | null
}

/**
 * Check if a user is premium
 */
export async function isPremiumUser(userId: string): Promise<boolean> {
  const result = await db.select().from(users).where(eq(users.id, userId))

  if (result.length === 0) {
    return false
  }

  return result[0].isPremium ?? false
}

/**
 * Get full premium status details for a user
 */
export async function getPremiumStatus(userId: string): Promise<PremiumStatus> {
  const result = await db.select().from(users).where(eq(users.id, userId))

  if (result.length === 0) {
    return {
      isPremium: false,
      premiumSince: null,
    }
  }

  const user = result[0]
  return {
    isPremium: user.isPremium ?? false,
    premiumSince: user.premiumSince,
  }
}

/**
 * Grant premium access to a user (idempotent)
 */
export async function grantPremium(
  userId: string,
  stripeCustomerId: string
): Promise<void> {
  const result = await db.select().from(users).where(eq(users.id, userId))

  if (result.length === 0) {
    return
  }

  const user = result[0]

  // Idempotent: if already premium, return early
  if (user.isPremium) {
    return
  }

  await db
    .update(users)
    .set({
      isPremium: true,
      premiumSince: new Date(),
      stripeCustomerId,
    })
    .where(eq(users.id, userId))
}
