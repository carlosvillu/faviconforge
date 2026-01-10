import Stripe from 'stripe'
import { db } from '~/db'
import { users } from '~/db/schema/users'
import { eq } from 'drizzle-orm'

// Initialize Stripe client at module level
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-12-15.clover',
})

/**
 * Get or create a Stripe Customer for a user
 * @param userId - The user's database ID
 * @param email - The user's email
 * @param name - The user's name (optional)
 * @param existingStripeCustomerId - Existing Stripe Customer ID if any
 * @returns Stripe Customer ID
 */
async function getOrCreateStripeCustomer(
    userId: string,
    email: string,
    name: string | null,
    existingStripeCustomerId: string | null
): Promise<string> {
    // If user already has a Stripe customer, return it
    if (existingStripeCustomerId) {
        return existingStripeCustomerId
    }

    // Create new customer in Stripe
    const customer = await stripe.customers.create({
        email,
        name: name || undefined,
        metadata: {
            userId,
        },
    })

    // Save the stripeCustomerId in the DB for future purchases
    await db
        .update(users)
        .set({ stripeCustomerId: customer.id })
        .where(eq(users.id, userId))

    return customer.id
}

/**
 * Creates a Stripe Checkout session for the premium package
 * @param userId - The authenticated user's ID
 * @param origin - The request origin URL (for success/cancel URLs)
 * @returns The checkout session URL
 */
export async function createCheckoutSession(
    userId: string,
    origin: string
): Promise<string> {
    const priceId = process.env.STRIPE_PRICE_ID

    if (!priceId) {
        throw new Error('STRIPE_PRICE_ID not configured')
    }

    // Get user data from database
    const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

    if (userResult.length === 0) {
        throw new Error('User not found')
    }

    const user = userResult[0]

    // Get or create Stripe Customer
    const stripeCustomerId = await getOrCreateStripeCustomer(
        user.id,
        user.email,
        user.name,
        user.stripeCustomerId
    )

    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        customer: stripeCustomerId,
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        metadata: {
            userId: userId,
        },
        success_url: `${origin}/success`,
        cancel_url: `${origin}/download`,
    })

    if (!session.url) {
        throw new Error('Failed to create checkout URL')
    }

    return session.url
}
