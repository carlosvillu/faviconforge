import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router'
import {
  getMockEmails,
  clearMockEmails,
  resetRateLimits,
} from '~/services/contact.server'

// GET /api/__test__/contact - Return mock emails sent
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function loader(_args: LoaderFunctionArgs) {
  // Only available in test environment
  if (!process.env.DB_TEST_URL) {
    throw new Response('Not Found', { status: 404 })
  }

  const emails = getMockEmails()
  return Response.json({ emails })
}

// DELETE /api/__test__/contact - Clear mock emails and reset rate limits
export async function action({ request }: ActionFunctionArgs) {
  // Only available in test environment
  if (!process.env.DB_TEST_URL) {
    throw new Response('Not Found', { status: 404 })
  }

  if (request.method !== 'DELETE') {
    throw new Response('Method Not Allowed', { status: 405 })
  }

  clearMockEmails()
  resetRateLimits()

  return Response.json({ cleared: true })
}
