# FEATURE_4.2_PremiumStatusAuth.md

## 1. Natural Language Description

### Current State (Before)
- The download page loader already fetches premium status for logged-in users (implemented in Task 3.2)
- `DownloadActionBar` already handles 4 different action states (login, buy, download premium, download free)
- `PremiumPackageCard` is a simple selectable card with no visual indication of premium/lock status
- All necessary i18n keys already exist in `en.json` and `es.json`
- No E2E tests exist for premium status integration with auth

### Expected State (After)
- `PremiumPackageCard` shows visual indicators based on user state:
  - Not logged in: Lock icon visible
  - Logged in, not premium: Lock icon visible
  - Premium user: "UNLOCKED" badge visible, no lock
- E2E tests verify that premium status is correctly reflected in the UI
- **PremiumContext NOT created** (the existing loader → props flow is sufficient)

### Acceptance Criteria
1. Premium users see "UNLOCKED" badge on PremiumPackageCard
2. Non-premium users (logged in or anonymous) see a lock icon
3. E2E test passes: create session → grant premium → UI shows unlocked state
4. E2E test passes: create session → no premium → UI shows locked state
5. `npm run typecheck` and `npm run lint` pass

---

## 2. Technical Description

### Approach
This task adds visual feedback to `PremiumPackageCard` to indicate premium status. The component will receive `isPremium` and `isLoggedIn` props from the download page and render:
- A **lock icon** (from Lucide) when the user cannot access premium (not premium or not logged in)
- An **"UNLOCKED" badge** when the user is premium

The existing `DownloadActionBar` already handles the action logic (buy button, login redirect, download button), so `PremiumPackageCard` only needs to add visual indicators.

### Architecture Decision
**No PremiumContext** - The premium status is fetched once in the download page loader and passed down via props. This is simpler and sufficient for the current use case where premium status is only needed on the download page.

### Testing Strategy
According to `docs/KNOWN_ISSUES.md`, OAuth flows cannot be tested in E2E. We will:
1. Use `createAuthSession` helper to create a user session via Better Auth API
2. Use the existing test endpoint `/api/__test__/premium` to grant premium status
3. Verify UI reflects the correct state

---

## 2.1. Architecture Gate

- **Pages are puzzles:** `download.tsx` composes components, passes loader data as props.
- **Loaders/actions are thin:** The loader calls `getCurrentUser` and `getPremiumStatus` services, returns data.
- **Business logic is not in components:** Premium status logic is in `app/services/premium.server.ts`. Components only render based on props.

Route module `download.tsx`:
- **Services called:** `getCurrentUser`, `getPremiumStatus`
- **Components composed:** `DownloadSection`, `FreePackageCard`, `PremiumPackageCard`, `DownloadActionBar`, etc.

Component `PremiumPackageCard.tsx`:
- **Hooks used:** `useTranslation`
- **Business logic NOT inside:** No DB calls, no auth checks. Only renders based on `isPremium` prop.

---

## 3. Files to Change/Create

### `app/components/download/PremiumPackageCard.tsx`
**Objective:** Add visual indicators (lock icon / UNLOCKED badge) based on premium status.

**Pseudocode:**
```pseudocode
COMPONENT PremiumPackageCard
  PROPS:
    isSelected: boolean
    onSelect: () => void
    isPremium: boolean (NEW)
    isLoggedIn: boolean (NEW)

  RENDER:
    BUTTON with card styling (existing)
      IF isPremium:
        BADGE "UNLOCKED" (green, top-left, absolute positioned)
      ELSE:
        LOCK ICON (Lucide Lock, top-left, absolute positioned)

      (rest of existing card content unchanged)
END
```

**Changes:**
- Add `isPremium` and `isLoggedIn` props to type definition
- Import `Lock` icon from `lucide-react`
- Add conditional rendering for lock icon or UNLOCKED badge
- Badge styling: absolute position, green background, white text, uppercase, small font

---

### `app/routes/download.tsx`
**Objective:** Pass `isPremium` and `isLoggedIn` props to `PremiumPackageCard`.

**Pseudocode:**
```pseudocode
COMPONENT DownloadPage
  (existing code unchanged)

  RENDER:
    PremiumPackageCard
      isSelected={download.selectedTier === 'premium'}
      onSelect={() => download.setSelectedTier('premium')}
      isPremium={isPremium}        // NEW prop
      isLoggedIn={!!user}          // NEW prop
END
```

**Changes:**
- Add `isPremium` and `isLoggedIn` props to `PremiumPackageCard` component call (lines 92-95)

---

### `tests/e2e/premium-download.spec.ts`
**Objective:** E2E tests to verify premium status is reflected in download page UI.

**Pseudocode:**
```pseudocode
TEST SUITE "Premium status on download page"

  BEFORE EACH:
    resetDatabase(dbContext)
    Upload test image via UI (to populate sessionStorage/IndexedDB)

  TEST "anonymous user sees lock icon on premium card"
    NAVIGATE to /download
    EXPECT lock icon visible on premium card
    EXPECT "UNLOCKED" badge NOT visible

  TEST "logged in non-premium user sees lock icon"
    CREATE session via createAuthSession helper
    SET auth cookie
    NAVIGATE to /download
    EXPECT lock icon visible on premium card
    EXPECT "UNLOCKED" badge NOT visible

  TEST "premium user sees UNLOCKED badge"
    CREATE session via createAuthSession helper
    GRANT premium via /api/__test__/premium endpoint
    SET auth cookie
    NAVIGATE to /download
    EXPECT "UNLOCKED" badge visible
    EXPECT lock icon NOT visible
END
```

---

## 4. I18N Section

### Existing keys to reuse
All required keys already exist:
- `download_premium_title` - "Premium"
- `download_best_value` - "BEST VALUE"
- `download_premium_lifetime` - "ONE-TIME * FOREVER"

### New keys to create
| Key | English | Spanish |
|-----|---------|---------|
| `download_premium_unlocked` | UNLOCKED | DESBLOQUEADO |

---

## 5. E2E Test Plan

### Test 1: Anonymous user sees lock icon on premium card
- **Preconditions:** No user session, test image uploaded to storage
- **Steps:**
  1. Upload a test image via UI flow
  2. Navigate to `/download`
- **Expected:** Lock icon is visible on PremiumPackageCard, "UNLOCKED" badge is NOT visible

### Test 2: Logged in non-premium user sees lock icon
- **Preconditions:** User session created (not premium), test image uploaded
- **Steps:**
  1. Create auth session via `createAuthSession` helper
  2. Set auth cookie via `setAuthCookie`
  3. Upload a test image via UI flow
  4. Navigate to `/download`
- **Expected:** Lock icon is visible, "UNLOCKED" badge is NOT visible

### Test 3: Premium user sees UNLOCKED badge
- **Preconditions:** User session created and granted premium, test image uploaded
- **Steps:**
  1. Create auth session via `createAuthSession` helper
  2. Grant premium via POST `/api/__test__/premium` with userId and stripeCustomerId
  3. Set auth cookie via `setAuthCookie`
  4. Upload a test image via UI flow
  5. Navigate to `/download`
- **Expected:** "UNLOCKED" badge is visible, lock icon is NOT visible

---

## 6. Definition of Done

1. **ALL tests pass:**
   - `npm run test:e2e -- --retries=1` (including new premium-download.spec.ts)
   - `npm run test:unit` (no unit tests added in this task)
2. `npm run typecheck` passes
3. `npm run lint` passes
4. All acceptance criteria from section 1 are met:
   - Premium users see "UNLOCKED" badge
   - Non-premium users see lock icon
   - E2E tests verify UI states

---

## 7. Summary of Changes

| File | Type | Change |
|------|------|--------|
| `app/components/download/PremiumPackageCard.tsx` | Modify | Add lock icon / UNLOCKED badge based on isPremium prop |
| `app/routes/download.tsx` | Modify | Pass isPremium and isLoggedIn props to PremiumPackageCard |
| `app/locales/en.json` | Modify | Add `download_premium_unlocked` key |
| `app/locales/es.json` | Modify | Add `download_premium_unlocked` key |
| `tests/e2e/premium-download.spec.ts` | Create | E2E tests for premium status on download page |

---

## 8. Out of Scope (from original plan)

- **PremiumContext NOT created** - The existing loader → props flow is sufficient. If premium status is needed elsewhere in the future, a context can be added then.
- **download.tsx loader** - Already implemented in Task 3.2, no changes needed.
- **DownloadActionBar** - Already handles action states, no changes needed.

---

_Created: 2025-01-09_
_Task: 4.2 - Integrate premium status with auth_
