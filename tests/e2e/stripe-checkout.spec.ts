import { test, expect } from '../fixtures'

test.describe('Stripe Checkout API', () => {
    test('Unauthenticated user receives 401', async ({ request, appServer }) => {
        const baseUrl = `http://localhost:${appServer.port}`

        // Make POST request without authentication
        const response = await request.post(`${baseUrl}/api/stripe/checkout`)

        expect(response.status()).toBe(401)

        const body = await response.json()
        expect(body.error).toBe('Unauthorized')
    })

    test('GET request receives 405', async ({ request, appServer }) => {
        const baseUrl = `http://localhost:${appServer.port}`

        // Make GET request to POST-only endpoint
        const response = await request.get(`${baseUrl}/api/stripe/checkout`)

        expect(response.status()).toBe(405)

        const body = await response.json()
        expect(body.error).toBe('Method not allowed')
    })
})
