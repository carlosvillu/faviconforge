import { test, expect, seedUser } from '../fixtures'
import { resetDatabase } from '../helpers/db'
import Stripe from 'stripe'

const stripe = new Stripe('sk_test_mock', {
    apiVersion: '2025-12-15.clover',
})

test.describe('Stripe Webhook', () => {
    test.beforeEach(async ({ dbContext }) => {
        await resetDatabase(dbContext)
    })

    test('webhook grants premium status on checkout.session.completed', async ({
        request,
        appServer,
        dbContext,
    }) => {
        // 1. Seed user
        const userId = await seedUser(dbContext, 'bob')
        const baseUrl = `http://localhost:${appServer.port}`

        // 2. Prepare payload
        const payload = {
            id: 'evt_test_webhook',
            object: 'event',
            type: 'checkout.session.completed',
            api_version: '2025-12-15.clover',
            created: Math.floor(Date.now() / 1000),
            data: {
                object: {
                    id: 'cs_test_session',
                    object: 'checkout.session',
                    customer: 'cus_test_webhook',
                    metadata: {
                        userId: userId,
                    },
                    mode: 'payment',
                    payment_status: 'paid',
                    status: 'complete',
                },
            },
        }

        const payloadString = JSON.stringify(payload)

        // 3. Check for Secret
        if (!process.env.STRIPE_WEBHOOK_SECRET) {
            console.warn('Skipping webhook signature test due to missing STRIPE_WEBHOOK_SECRET env var')
            test.skip()
            return
        }

        // 4. Sign payload
        const header = stripe.webhooks.generateTestHeaderString({
            payload: payloadString,
            secret: process.env.STRIPE_WEBHOOK_SECRET,
        })

        // 5. Send Webhook
        // We send payloadString directly to ensure exact body matching for signature
        const responsePost = await request.post(`${baseUrl}/api/stripe/webhook`, {
            data: payloadString,
            headers: {
                'Stripe-Signature': header,
                'Content-Type': 'application/json; charset=utf-8' // Explicit charset usually nice, mostly json defaults to utf8 within axios/fetch
            }
        })

        expect(responsePost.status()).toBe(200)

        // 6. Verify User is Premium
        const result = await dbContext.client.query(
            'SELECT is_premium, stripe_customer_id FROM users WHERE id = $1',
            [userId]
        )
        const userRow = result.rows[0]
        expect(userRow.is_premium).toBe(true)
        expect(userRow.stripe_customer_id).toBe('cus_test_webhook')
    })

    test('webhook grants premium even when customer is null', async ({
        request,
        appServer,
        dbContext,
    }) => {
        // 1. Seed user
        const userId = await seedUser(dbContext, 'charlie')
        const baseUrl = `http://localhost:${appServer.port}`

        // 2. Prepare payload with null customer (edge case)
        const payload = {
            id: 'evt_test_webhook_null',
            object: 'event',
            type: 'checkout.session.completed',
            api_version: '2025-12-15.clover',
            created: Math.floor(Date.now() / 1000),
            data: {
                object: {
                    id: 'cs_test_session_null',
                    object: 'checkout.session',
                    customer: null,
                    metadata: {
                        userId: userId,
                    },
                    mode: 'payment',
                    payment_status: 'paid',
                    status: 'complete',
                },
            },
        }

        const payloadString = JSON.stringify(payload)

        // 3. Check for Secret
        if (!process.env.STRIPE_WEBHOOK_SECRET) {
            console.warn('Skipping webhook signature test due to missing STRIPE_WEBHOOK_SECRET env var')
            test.skip()
            return
        }

        // 4. Sign payload
        const header = stripe.webhooks.generateTestHeaderString({
            payload: payloadString,
            secret: process.env.STRIPE_WEBHOOK_SECRET,
        })

        // 5. Send Webhook
        const responsePost = await request.post(`${baseUrl}/api/stripe/webhook`, {
            data: payloadString,
            headers: {
                'Stripe-Signature': header,
                'Content-Type': 'application/json; charset=utf-8'
            }
        })

        expect(responsePost.status()).toBe(200)

        // 6. Verify User is Premium (even with null customer)
        const result = await dbContext.client.query(
            'SELECT is_premium, stripe_customer_id FROM users WHERE id = $1',
            [userId]
        )
        const userRow = result.rows[0]
        expect(userRow.is_premium).toBe(true)
        // stripe_customer_id should remain null in this edge case
        expect(userRow.stripe_customer_id).toBeNull()
    })

    test('webhook rejects invalid signature', async ({
        request,
        appServer,
    }) => {
        const baseUrl = `http://localhost:${appServer.port}`

        const response = await request.post(`${baseUrl}/api/stripe/webhook`, {
            data: JSON.stringify({ obj: 'fake' }),
            headers: {
                'Stripe-Signature': 't=123,v1=invalid_sig',
                'Content-Type': 'application/json'
            }
        })

        expect(response.status()).toBe(400)
    })
})
