import { Resend } from 'resend'

// Rate limiting state (in-memory)
type RateLimitEntry = { count: number; firstRequest: number }
const rateLimitMap = new Map<string, RateLimitEntry>()
const RATE_LIMIT = 3
const RATE_WINDOW_MS = 60 * 60 * 1000 // 1 hour

// Mock emails storage for testing
const mockEmails: Array<{
  name: string
  email: string
  message: string
  timestamp: number
}> = []

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  resetIn: number
}

export function checkRateLimit(ip: string): RateLimitResult {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  // No entry or expired window - create new entry
  if (!entry || now - entry.firstRequest >= RATE_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, firstRequest: now })
    return {
      allowed: true,
      remaining: RATE_LIMIT - 1,
      resetIn: RATE_WINDOW_MS,
    }
  }

  // Rate limit exceeded
  if (entry.count >= RATE_LIMIT) {
    const resetIn = entry.firstRequest + RATE_WINDOW_MS - now
    return {
      allowed: false,
      remaining: 0,
      resetIn,
    }
  }

  // Increment count
  entry.count++
  return {
    allowed: true,
    remaining: RATE_LIMIT - entry.count,
    resetIn: entry.firstRequest + RATE_WINDOW_MS - now,
  }
}

export function resetRateLimits(): void {
  rateLimitMap.clear()
}

export type ContactEmailParams = {
  name: string
  email: string
  message: string
}

function formatPlainText(params: ContactEmailParams): string {
  return `New contact form submission from FaviconForge:

Name: ${params.name}
Email: ${params.email}

Message:
${params.message}

---
This message was sent via the FaviconForge contact form.`
}

function formatHtml(params: ContactEmailParams): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #facc15; color: #000; padding: 20px; font-weight: bold; text-transform: uppercase; }
    .content { padding: 20px; background: #f9f9f9; }
    .field { margin-bottom: 15px; }
    .label { font-weight: bold; color: #666; }
    .message { background: #fff; padding: 15px; border-left: 4px solid #facc15; }
    .footer { padding: 15px; font-size: 12px; color: #666; border-top: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">New Contact Form Submission</div>
    <div class="content">
      <div class="field">
        <span class="label">Name:</span> ${escapeHtml(params.name)}
      </div>
      <div class="field">
        <span class="label">Email:</span> <a href="mailto:${escapeHtml(params.email)}">${escapeHtml(params.email)}</a>
      </div>
      <div class="field">
        <span class="label">Message:</span>
        <div class="message">${escapeHtml(params.message).replace(/\n/g, '<br>')}</div>
      </div>
    </div>
    <div class="footer">
      This message was sent via the FaviconForge contact form.
    </div>
  </div>
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export async function sendContactEmail(params: ContactEmailParams): Promise<void> {
  // In test mode, store email in memory instead of sending
  if (process.env.DB_TEST_URL) {
    mockEmails.push({
      ...params,
      timestamp: Date.now(),
    })
    return
  }

  const resendApiKey = process.env.RESEND_API_KEY
  const contactEmail = process.env.CONTACT_EMAIL
  const emailFrom = process.env.EMAIL_FROM

  if (!resendApiKey || !contactEmail || !emailFrom) {
    throw new Error('Missing email configuration (RESEND_API_KEY, CONTACT_EMAIL, or EMAIL_FROM)')
  }

  const resend = new Resend(resendApiKey)

  try {
    const { error } = await resend.emails.send({
      from: emailFrom,
      to: contactEmail,
      replyTo: params.email,
      subject: `Contact Form: Message from ${params.name}`,
      text: formatPlainText(params),
      html: formatHtml(params),
    })

    if (error) {
      console.error('Resend error:', error)
      throw new Error('Failed to send email')
    }
  } catch (error) {
    console.error('Email sending error:', error)
    throw new Error('Failed to send email')
  }
}

// Test helpers
export function getMockEmails() {
  return [...mockEmails]
}

export function clearMockEmails() {
  mockEmails.length = 0
}
