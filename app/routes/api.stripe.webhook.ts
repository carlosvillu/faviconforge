import type { ActionFunctionArgs } from 'react-router'
import { stripe } from '~/services/stripe.server'
import { grantPremium } from '~/services/premium.server'

export const action = async ({ request }: ActionFunctionArgs) => {
    if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 })
    }

    const signature = request.headers.get('stripe-signature')
    const payload = await request.text()

    if (!signature) {
        return new Response('Missing stripe-signature header', { status: 400 })
    }

    let event

    try {
        event = stripe.webhooks.constructEvent(
            payload,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        )
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        console.error(`Webhook signature verification failed: ${errorMessage}`)
        return new Response(`Webhook Error: ${errorMessage}`, { status: 400 })
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object
        const userId = session.metadata?.userId
        const stripeCustomerId = session.customer

        if (userId && typeof stripeCustomerId === 'string') {
            try {
                await grantPremium(userId, stripeCustomerId)
                console.log(`Granted premium to user ${userId}`)
            } catch (error) {
                console.error('Error granting premium:', error)
                // We still return 200 to Stripe to acknowledge receipt, otherwise it will retry.
                // But logging the error is important.
            }
        } else {
            console.error('Missing userId or stripeCustomerId in session metadata')
        }
    }

    return new Response(null, { status: 200 })
}
