import Stripe from 'stripe'

// Initialize Stripe client at module level
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-12-15.clover',
})

/**
 * Creates a Stripe Checkout session for the premium package
 * @param userId - The authenticated user's ID (for webhook metadata)
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

    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
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
