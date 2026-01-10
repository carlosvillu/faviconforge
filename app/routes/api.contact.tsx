import type { ActionFunctionArgs } from 'react-router'
import { z } from 'zod'
import { sendContactEmail, checkRateLimit } from '~/services/contact.server'

const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  message: z.string().min(10).max(2000),
})

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  return 'unknown'
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'method_not_allowed' }, { status: 405 })
  }

  const clientIp = getClientIp(request)

  // Check rate limit
  const rateCheck = checkRateLimit(clientIp)
  if (!rateCheck.allowed) {
    return Response.json(
      {
        error: 'rate_limited',
        resetIn: rateCheck.resetIn,
      },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil(rateCheck.resetIn / 1000)) },
      }
    )
  }

  // Parse and validate body
  try {
    const body = await request.json()
    const parsed = contactSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { error: 'validation_error', details: parsed.error.issues },
        { status: 400 }
      )
    }

    // Send email
    await sendContactEmail(parsed.data)

    return Response.json({
      success: true,
      remaining: rateCheck.remaining,
    })
  } catch (error) {
    console.error('Contact form error:', error)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}
