import type { ActionFunctionArgs } from 'react-router'
import { getCurrentUser } from '~/lib/auth.server'
import { createCheckoutSession } from '~/services/stripe.server'

export async function loader() {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function action({ request }: ActionFunctionArgs) {
    if (request.method !== 'POST') {
        return Response.json({ error: 'Method not allowed' }, { status: 405 })
    }

    try {
        // Get current user - don't use requireAuth as it throws redirect
        const authSession = await getCurrentUser(request)

        if (!authSession) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const origin = new URL(request.url).origin
        const checkoutUrl = await createCheckoutSession(authSession.user.id, origin)

        return Response.json({ url: checkoutUrl })
    } catch (error) {
        console.error('Checkout error:', error)
        return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
}
