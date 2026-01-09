# FEATURE_5.1_StripeCheckoutEndpoint.md

## 1. Natural Language Description

### Current State (Before)
- The premium package card shows "Buy Premium - €5" but clicking does nothing
- No Stripe integration exists in the codebase
- Users can see premium formats but cannot purchase them

### Expected State (After)
- A POST endpoint at `/api/stripe/checkout` exists
- Authenticated users can call this endpoint to receive a Stripe Checkout URL
- The checkout session includes user ID in metadata (for webhook processing in Task 5.2)
- Unauthenticated users receive 401 Unauthorized
- Success URL redirects to `/success`, cancel URL redirects to `/download`

---

## 2. Technical Description

### High-Level Approach
1. **Install Stripe packages**: `stripe` (server SDK) and `@stripe/stripe-js` (client SDK for future use)
2. **Create Stripe service**: Initialize Stripe client with `STRIPE_SECRET_KEY` from environment
3. **Create checkout endpoint**: POST-only route that:
   - Validates authentication via `requireAuth()`
   - Creates a Stripe Checkout Session with the configured `STRIPE_PRICE_ID`
   - Includes `userId` in session metadata for webhook correlation
   - Returns the checkout URL for client-side redirect

### Architecture Decisions
- **Server-only Stripe logic**: All Stripe operations happen server-side in `app/services/stripe.server.ts`
- **Thin route handler**: The route only handles request parsing, auth, and returns the service result
- **No database writes**: This endpoint only creates the checkout session; database updates happen in the webhook (Task 5.2)

### Dependencies
- `stripe` (npm): Server-side Stripe SDK
- `@stripe/stripe-js` (npm): Client-side Stripe utilities (for future checkout redirect)

### Environment Variables (already configured)
- `STRIPE_SECRET_KEY`: Stripe API key for server operations
- `STRIPE_PRICE_ID`: Pre-configured price ID for €5 lifetime premium

---

## 2.1. Architecture Gate

- **Pages are puzzles:** N/A - this is an API route with no UI
- **Loaders/actions are thin:** The action parses the request, calls `requireAuth()`, calls `createCheckoutSession()` service, returns JSON response
- **Business logic is not in components:** All Stripe logic lives in `app/services/stripe.server.ts`

### Route Module Breakdown
- **`api.stripe.checkout.ts`**:
  - **Action**: Calls `requireAuth(request)`, then calls `createCheckoutSession(userId, origin)` service
  - **Loader**: Not needed (POST-only endpoint)
  - **Component**: Not needed (API-only)

### Service Breakdown
- **`stripe.server.ts`**:
  - Initializes Stripe client once at module level
  - `createCheckoutSession(userId, origin)`: Creates checkout session, returns URL
  - All Stripe-specific logic encapsulated here

---

## 3. Files to Change/Create

### `app/services/stripe.server.ts`
**Objective:** Initialize Stripe client and provide checkout session creation

**Pseudocode:**
```pseudocode
IMPORT Stripe from 'stripe'

// Initialize Stripe client at module level
CONST stripe = NEW Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia'  // Use latest stable API version
})

FUNCTION createCheckoutSession(userId: string, origin: string): Promise<string>
  INPUT:
    - userId: The authenticated user's ID (for webhook metadata)
    - origin: The request origin URL (for success/cancel URLs)
  
  PROCESS:
    - priceId = process.env.STRIPE_PRICE_ID
    - IF priceId IS undefined THEN throw Error('STRIPE_PRICE_ID not configured')
    
    - session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [{
          price: priceId,
          quantity: 1
        }],
        metadata: {
          userId: userId
        },
        success_url: `${origin}/success`,
        cancel_url: `${origin}/download`
      })
    
    - IF session.url IS null THEN throw Error('Failed to create checkout URL')
  
  OUTPUT: session.url (string)
END
```

---

### `app/routes/api.stripe.checkout.ts`
**Objective:** POST endpoint to create Stripe checkout session for authenticated users

**Pseudocode:**
```pseudocode
IMPORT requireAuth from '~/lib/auth.server'
IMPORT createCheckoutSession from '~/services/stripe.server'

// No loader needed - POST only endpoint

FUNCTION action({ request }: Route.ActionArgs): Promise<Response>
  INPUT: HTTP request
  
  PROCESS:
    - IF request.method !== 'POST' THEN
        RETURN json({ error: 'Method not allowed' }, { status: 405 })
    
    - TRY:
        - { user } = await requireAuth(request)
        - origin = new URL(request.url).origin
        - checkoutUrl = await createCheckoutSession(user.id, origin)
        - RETURN json({ url: checkoutUrl })
      CATCH error:
        - IF error is redirect (from requireAuth) THEN
            RETURN json({ error: 'Unauthorized' }, { status: 401 })
        - console.error('Checkout error:', error)
        - RETURN json({ error: 'Internal server error' }, { status: 500 })
  
  OUTPUT: JSON response with checkout URL or error
END
```

---

### `app/routes.ts`
**Objective:** Register the new API route

**Pseudocode:**
```pseudocode
// Add to existing route definitions:
route('api/stripe/checkout', 'routes/api.stripe.checkout.ts')
```

---

## 4. I18N Section

This task is API-only with no UI. Error messages are HTTP status codes without translated content.

**No i18n keys needed for this task.**

(UI integration with translated messages will be handled in Task 5.3)

---

## 5. E2E Test Plan

### Test File: `tests/e2e/stripe-checkout.spec.ts`

### Test: Unauthenticated user receives 401

- **Preconditions:** No user session exists
- **Steps:**
  1. Make POST request to `/api/stripe/checkout` without authentication
- **Expected:** Response status is 401, body contains `{ error: 'Unauthorized' }`

### Test: Non-POST methods receive 405

- **Preconditions:** None
- **Steps:**
  1. Make GET request to `/api/stripe/checkout`
- **Expected:** Response status is 405, body contains `{ error: 'Method not allowed' }`

---

## 6. Definition of Done

A task is NOT complete unless ALL of the following are green:

1. **Tests pass:**
   - `npm run test:e2e -- tests/e2e/stripe-checkout.spec.ts --retries=1` passes
2. `npm run typecheck` passes
3. `npm run lint` passes
4. All acceptance criteria met:
   - [ ] `stripe` and `@stripe/stripe-js` packages installed
   - [ ] `app/services/stripe.server.ts` exists with `createCheckoutSession()` function
   - [ ] `app/routes/api.stripe.checkout.ts` exists and is registered
   - [ ] Endpoint validates authentication before creating session
   - [ ] User ID is included in checkout session metadata
   - [ ] Success URL points to `/success`, cancel URL to `/download`

---

_Planning created: 2026-01-09_
_Task: 5.1 - Create Stripe checkout endpoint_
