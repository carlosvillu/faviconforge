# FEATURE_0.2_PremiumStatusHelpers.md

## 1. Natural Language Description

### Current State
The database schema has the premium fields (`isPremium`, `premiumSince`, `stripeCustomerId`) on the users table (Task 0.1 completed). However, there's no service layer to query or update these fields. The `app/services/` directory doesn't exist yet.

### Expected End State
A `premium.server.ts` service exists with three helper functions:
- Check if a user is premium
- Get full premium status details
- Grant premium access to a user (idempotent)

Additionally, i18n keys for premium-related UI text are available in both English and Spanish.

---

## 2. Technical Description

### Approach
Create a server-side service module that encapsulates all premium-related database operations. The service will use Drizzle ORM to query and update the users table.

### Architecture Decisions
- **File location:** `app/services/premium.server.ts` (React Router convention for server-only code)
- **Idempotent grant:** If user is already premium, `grantPremium` returns without updating
- **No throwing on missing user:** Functions return sensible defaults (`false`, `null`) if user not found
- **Type exports:** Export return types for use in loaders/components

### Dependencies
- `drizzle-orm` (already installed)
- `app/db` (existing database client)
- `app/db/schema/users` (existing schema)

---

## 2.1. Architecture Gate

- **Pages are puzzles:** N/A - This task creates a service, not UI.
- **Loaders/actions are thin:** The service will be called from loaders/actions. Loaders will NOT implement premium logic inline.
- **Business logic is not in components:** All premium business logic lives in `app/services/premium.server.ts`.

---

## 3. Files to Change/Create

### `app/services/premium.server.ts`
**Objective:** Server-side service with helper functions to check and grant premium status.

**Pseudocode:**
```pseudocode
IMPORT db from app/db
IMPORT users, eq from schema/drizzle

FUNCTION isPremiumUser(userId: string): Promise<boolean>
  INPUT: userId (string, UUID)
  PROCESS:
    - Query users table WHERE id = userId
    - Return user.isPremium if found, false if not found
  OUTPUT: boolean

FUNCTION getPremiumStatus(userId: string): Promise<{isPremium: boolean, premiumSince: Date | null}>
  INPUT: userId (string, UUID)
  PROCESS:
    - Query users table WHERE id = userId
    - If not found, return {isPremium: false, premiumSince: null}
    - Return {isPremium: user.isPremium, premiumSince: user.premiumSince}
  OUTPUT: object with isPremium (boolean) and premiumSince (Date | null)

FUNCTION grantPremium(userId: string, stripeCustomerId: string): Promise<void>
  INPUT: userId (string, UUID), stripeCustomerId (string)
  PROCESS:
    - Query users table WHERE id = userId
    - If not found, return early (no-op)
    - If user.isPremium is true, return early (idempotent)
    - Update user: isPremium = true, premiumSince = NOW(), stripeCustomerId = stripeCustomerId
  OUTPUT: void
```

---

### `app/locales/en.json`
**Objective:** Add premium-related i18n keys for English.

**Changes to add:**
```json
{
  "premium_user": "Premium User",
  "not_premium": "Free User",
  "premium_since": "Premium since {{date}}",
  "upgrade_to_premium": "Upgrade to Premium",
  "buy_premium": "Buy Premium",
  "premium_price": "€5 one-time",
  "premium_benefits_title": "Premium Benefits",
  "premium_benefits_description": "Get all favicon formats including PWA, Apple Touch icons, Windows tiles, and manifest customization."
}
```

---

### `app/locales/es.json`
**Objective:** Add premium-related i18n keys for Spanish.

**Changes to add:**
```json
{
  "premium_user": "Usuario Premium",
  "not_premium": "Usuario Gratuito",
  "premium_since": "Premium desde {{date}}",
  "upgrade_to_premium": "Mejorar a Premium",
  "buy_premium": "Comprar Premium",
  "premium_price": "€5 pago único",
  "premium_benefits_title": "Beneficios Premium",
  "premium_benefits_description": "Obtén todos los formatos de favicon incluyendo PWA, iconos Apple Touch, tiles de Windows y personalización del manifest."
}
```

---

## 4. I18N

### Existing keys to reuse
None - this is the first premium-related feature.

### New keys to create
| Key | English | Spanish |
|-----|---------|---------|
| `premium_user` | Premium User | Usuario Premium |
| `not_premium` | Free User | Usuario Gratuito |
| `premium_since` | Premium since {{date}} | Premium desde {{date}} |
| `upgrade_to_premium` | Upgrade to Premium | Mejorar a Premium |
| `buy_premium` | Buy Premium | Comprar Premium |
| `premium_price` | €5 one-time | €5 pago único |
| `premium_benefits_title` | Premium Benefits | Beneficios Premium |
| `premium_benefits_description` | Get all favicon formats including PWA, Apple Touch icons, Windows tiles, and manifest customization. | Obtén todos los formatos de favicon incluyendo PWA, iconos Apple Touch, tiles de Windows y personalización del manifest. |

**Note:** `premium_since` uses interpolation (`{{date}}`) for dynamic date formatting.

---

### `app/routes/api.__test__.premium.tsx`
**Objective:** Test-only endpoint to exercise premium service functions via E2E tests. Returns 404 in production (when `DB_TEST_URL` is not set).

**Pseudocode:**
```pseudocode
IMPORT getPremiumStatus, grantPremium from premium.server
IMPORT z from zod

SCHEMA grantSchema = { userId: uuid, stripeCustomerId: string }

FUNCTION loader(request)
  INPUT: request with ?userId query param
  PROCESS:
    - If DB_TEST_URL not set, return 404
    - Extract userId from URL search params
    - If no userId, return 400
    - Call getPremiumStatus(userId)
  OUTPUT: JSON { isPremium, premiumSince }

FUNCTION action(request)
  INPUT: POST request with JSON body { userId, stripeCustomerId }
  PROCESS:
    - If method !== POST, return 405
    - If DB_TEST_URL not set, return 404
    - Parse and validate JSON body with grantSchema
    - If invalid, return 400
    - Call grantPremium(userId, stripeCustomerId)
  OUTPUT: JSON { success: true }
```

---

### `app/routes.ts`
**Objective:** Register the test endpoint route.

**Changes to add:**
```typescript
route('api/__test__/premium', 'routes/api.__test__.premium.tsx'),
```

---

### `tests/e2e/premium-service.spec.ts`
**Objective:** E2E tests for premium service functions.

**Pseudocode:**
```pseudocode
DESCRIBE "Premium service"
  BEFORE_EACH: resetDatabase(dbContext)

  TEST "user is not premium by default"
    - Seed a user
    - GET /api/__test__/premium?userId=xxx
    - Expect isPremium = false, premiumSince = null

  TEST "grantPremium makes user premium"
    - Seed a user
    - POST /api/__test__/premium with { userId, stripeCustomerId }
    - GET /api/__test__/premium?userId=xxx
    - Expect isPremium = true, premiumSince = not null

  TEST "grantPremium is idempotent"
    - Seed a user
    - POST /api/__test__/premium with { userId, stripeCustomerId: "cus_1" }
    - Record premiumSince
    - POST /api/__test__/premium with { userId, stripeCustomerId: "cus_2" }
    - GET /api/__test__/premium?userId=xxx
    - Expect premiumSince unchanged (idempotent)

  TEST "getPremiumStatus returns defaults for non-existent user"
    - GET /api/__test__/premium?userId=<random-uuid>
    - Expect isPremium = false, premiumSince = null
```

---

## 5. E2E Test Plan

### Test: User is not premium by default
- **Preconditions:** User exists in database
- **Steps:**
  1. Seed user via `seedUser(dbContext, 'testUser')`
  2. GET `/api/__test__/premium?userId={userId}`
- **Expected:** Response contains `{ isPremium: false, premiumSince: null }`

### Test: grantPremium makes user premium
- **Preconditions:** User exists in database
- **Steps:**
  1. Seed user via `seedUser(dbContext, 'testUser')`
  2. POST `/api/__test__/premium` with `{ userId, stripeCustomerId: "cus_test123" }`
  3. GET `/api/__test__/premium?userId={userId}`
- **Expected:** Response contains `{ isPremium: true, premiumSince: <timestamp> }`

### Test: grantPremium is idempotent
- **Preconditions:** User exists and is already premium
- **Steps:**
  1. Seed user and grant premium
  2. Record `premiumSince` value
  3. Call grantPremium again with different stripeCustomerId
  4. GET `/api/__test__/premium?userId={userId}`
- **Expected:** `premiumSince` unchanged from original grant

### Test: getPremiumStatus returns defaults for non-existent user
- **Preconditions:** None
- **Steps:**
  1. GET `/api/__test__/premium?userId={random-uuid}`
- **Expected:** Response contains `{ isPremium: false, premiumSince: null }`

---

## 6. Verification Checklist

After implementation:
- [ ] `app/services/premium.server.ts` exists with all three functions
- [ ] Types are properly exported
- [ ] `app/routes/api.__test__.premium.tsx` exists with loader and action
- [ ] Route registered in `app/routes.ts`
- [ ] i18n keys added to both `en.json` and `es.json`
- [ ] `tests/e2e/premium-service.spec.ts` exists with all 4 tests
- [ ] `npm run test:e2e -- --retries=1` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes

---

_Planning created: 2026-01-03_
_Based on PLANNING.md Task 0.2_
