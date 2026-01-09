# FEATURE_5.2_StripeWebhook.md

## 1. Natural Language Description

### Objective
Implement a secure webhook handler to receive payment notifications from Stripe. When a user completes a payment, Stripe will send a `checkout.session.completed` event. The system must verify the event's authenticity and automatically upgrade the user's account to "Premium".

### Current State
- Users can initiate a checkout session (Task 5.1).
- Database has `isPremium` fields and `grantPremium` service exists.
- No mechanism currently updates the user status when payment completes.

### Expected End State
- A POST endpoint `/api/stripe/webhook` listens for Stripe events.
- When a valid payment event is received, the corresponding user in the database is marked as premium.
- Duplicate events are handled gracefully (idempotency via `grantPremium` logic or explicit checks).
- Invalid signatures or malformed requests are rejected.

## 2. Technical Description

### High-Level Approach
We will expose a React Router resource route designed to handle Stripe webhooks. This route will be pure server-side (no UI component). It will use the `stripe` node library to verify the request signature against the `STRIPE_WEBHOOK_SECRET` environment variable to ensure security. Upon successful verification of a `checkout.session.completed` event, it will extract the `userId` from the session metadata and call the existing domain service to update the user's status.

### Architecture Decisions
- **Signature Verification:** Critical security step. Must fail immediately if signature is invalid.
- **Raw Body Handling:** Stripe requires the raw request body for signature verification. We need to handle the request stream appropriately.
- **Service Layer:** The route will delegate the actual DB update to `grantPremium` in `app/services/premium.server.ts`.
- **Error Handling:** 400 for bad requests (invalid signature, parsing errors), 200 for success to acknowledge Stripe.

### Dependencies
- `stripe` (npm package)
- `app/services/premium.server.ts` (for `grantPremium`)
- Environment variable `STRIPE_WEBHOOK_SECRET`

### 2.1. Architecture Gate

- **Pages are puzzles:** This is a resource route (API), so it has NO component, only an `action`.
- **Loaders/actions are thin:** The action will parse the event, verify it, and call `grantPremium`. It will not contain DB queries directly.
- **Business logic is not in components:** N/A (no component). Logic resides in `premium.server.ts`.

## 3. Files to Change/Create

### `app/services/stripe.server.ts`
**Objective:** Export the Stripe instance to allow the webhook route to use it for signature verification.

**Pseudocode:**
```pseudocode
// Export the existing 'stripe' constant so it can be imported elsewhere
EXPORT const stripe = ...
```

### `app/routes/api.stripe.webhook.ts`
**Objective:** Handle incoming POST requests from Stripe, verify signature, and update user status.

**Pseudocode:**
```pseudocode
IMPORT stripe from services/stripe.server
IMPORT grantPremium from services/premium.server

FUNCTION action
  INPUT: request

  // 1. Validation methods
  IF method IS NOT POST -> RETURN 405 Method Not Allowed

  // 2. Get signature and payload
  CONST signature = request.headers.get("stripe-signature")
  CONST payload_text = await request.text()
  
  // 3. Verify signature
  TRY
    CONST event = stripe.webhooks.constructEvent(
      payload_text, 
      signature, 
      process.env.STRIPE_WEBHOOK_SECRET
    )
  CATCH error
    RETURN 400 Bad Request (Invalid signature)

  // 4. Handle Event
  IF event.type IS "checkout.session.completed"
    CONST session = event.data.object
    CONST userId = session.metadata.userId
    CONST stripeCustomerId = session.customer

    IF userId AND stripeCustomerId
      CALL grantPremium(userId, stripeCustomerId)
    ELSE
      LOG error "Missing metadata or customer ID"
      // Return 200 to stop Stripe from retrying invalid payload
  
  RETURN 200 OK
END
```

## 4. E2E Test Plan

### Test: Stripe Webhook grants premium status

- **Environment:**
  - Requires `STRIPE_WEBHOOK_SECRET` to be available (or a fallback test value).
  
- **Preconditions:**
  - A user exists in the database.
  - User is NOT premium.

- **Steps:**
  1. **Seed** a user using `seedUser`.
  2. **Generate** a valid Stripe `checkout.session.completed` event payload.
     - `metadata.userId`: [seeded user ID]
     - `customer`: "cus_test_123"
  3. **Sign** the payload:
     - Use `stripe.webhooks.generateTestHeaderString` (or manual HMAC SHA256) using key `process.env.STRIPE_WEBHOOK_SECRET`.
  4. **POST** to `/api/stripe/webhook` with the payload and `Stripe-Signature` header.
  5. **Verify** response is 200 OK.
  6. **Fetch** the user's premium status from the test endpoint (`/api/__test__/premium`).

- **Expected:**
  - Response status is 200.
  - User status is `isPremium: true`.
  - User `stripeCustomerId` matches the one in payload.

### Test: Webhook rejects invalid signature

- **Steps:**
  1. POST to `/api/stripe/webhook` with arbitrary body.
  2. Set `Stripe-Signature` to "invalid_signature".
- **Expected:**
  - Response status is 400.
  - User status remains unchanged.

## 5. Definition of Done

1. **ALL relevant tests pass:**
   - `npm run test:e2e -- --retries=1`
2. `npm run typecheck` passes
3. `npm run lint` passes
4. Webhook endpoint handles specific `checkout.session.completed` event.
5. User status is correctly updated in DB upon event.
