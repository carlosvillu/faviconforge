import { type LoaderFunctionArgs, type ActionFunctionArgs } from 'react-router'
import { z } from 'zod'
import { getPremiumStatus, grantPremium } from '~/services/premium.server'

const grantSchema = z.object({
  userId: z.string().uuid(),
  stripeCustomerId: z.string(),
})

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Only available in test environment
    if (!process.env.DB_TEST_URL) {
      throw new Response('Not Found', { status: 404 })
    }

    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')

    if (!userId) {
      throw new Response('userId is required', { status: 400 })
    }

    const status = await getPremiumStatus(userId)

    return new Response(JSON.stringify(status), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    if (error instanceof Response) {
      throw error
    }
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Premium loader error:', message)
    throw new Response(message, { status: 500 })
  }
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    // Only allow POST
    if (request.method !== 'POST') {
      throw new Response('Method Not Allowed', { status: 405 })
    }

    // Only available in test environment
    if (!process.env.DB_TEST_URL) {
      throw new Response('Not Found', { status: 404 })
    }

    let body
    try {
      body = await request.json()
    } catch {
      throw new Response('Invalid JSON', { status: 400 })
    }

    const result = grantSchema.safeParse(body)
    if (!result.success) {
      throw new Response('Invalid request body', { status: 400 })
    }

    const { userId, stripeCustomerId } = result.data
    await grantPremium(userId, stripeCustomerId)

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    if (error instanceof Response) {
      throw error
    }
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Premium action error:', message)
    throw new Response(message, { status: 500 })
  }
}
