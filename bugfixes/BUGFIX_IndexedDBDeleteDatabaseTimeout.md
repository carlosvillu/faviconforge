# BUGFIX_IndexedDBDeleteDatabaseTimeout.md

## 1. Bug Description

### Current Behavior (Bug)

Some Playwright E2E tests are **flaky** and fail with a **test timeout** while trying to clear IndexedDB state.

Observed failure signature:
- Test times out inside `clearIndexedDB(page)`.
- Stack points to `tests/e2e/helpers/indexeddb.ts` calling `page.evaluate(() => indexedDB.deleteDatabase('faviconforge'))`.

Example:
- `tests/e2e/upload.spec.ts` → `should store image and navigate on continue`
  - Timeout at `clearIndexedDB(page)`.

### Steps to reproduce

1. Run:

```bash
npm run test:e2e -- --timeout=15000
```

2. Observe intermittent failures where the test times out in `clearIndexedDB()`.

### Expected Behavior (After Fix)

- `clearIndexedDB(page)` should **never hang**.
- Clearing IndexedDB should complete **within a bounded time** even when the database deletion is blocked.
- E2E tests that depend on a clean IndexedDB state should be **deterministic** (no timeouts).

## 2. Technical Analysis

### Conflicting Flow

- Some tests clear IndexedDB **after loading an app page** (e.g. `await page.goto('/upload'); await clearIndexedDB(page)`), meaning the app may already have opened a connection to `indexedDB.open('faviconforge', 1)`.
- `indexedDB.deleteDatabase('faviconforge')` can trigger a **blocked** state if there are still open connections (even transient ones).
- Our current `clearIndexedDB` implementation:
  - Only resolves on `request.onsuccess` and `request.onerror`.
  - Does **not** handle `request.onblocked`.
  - Has **no watchdog timeout**, so if deletion stays blocked the Promise never resolves → Playwright test eventually times out.

### Root Cause

**OBVIOUS:** `clearIndexedDB()` does not handle the `IDBOpenDBRequest.onblocked` path and therefore can hang forever when the database deletion is blocked by open connections.

### Where this shows up

- `tests/e2e/helpers/indexeddb.ts`
  - `clearIndexedDB(page)`
- Call sites:
  - `tests/e2e/upload.spec.ts`
  - `tests/e2e/preview.spec.ts`
  - `tests/e2e/download.spec.ts`

## 3. Solution Plan

### `tests/e2e/helpers/indexeddb.ts`

**Objective:** Make `clearIndexedDB(page)` bounded and resilient, so it cannot hang the test suite.

**Pseudocode:**
```pseudocode
FUNCTION clearIndexedDB(page)
  page.evaluate(() =>
    CREATE Promise
      SET watchdog timer (e.g. 2000-5000ms) -> resolve()
      TRY
        request = indexedDB.deleteDatabase('faviconforge')

        request.onsuccess -> clear timer -> resolve()
        request.onerror -> clear timer -> resolve()  // DB may not exist
        request.onblocked -> clear timer -> resolve() // important: do not hang

      CATCH
        clear timer -> resolve()
  )
END
```

**Notes / guardrails:**
- The helper should **resolve even on blocked** to avoid test timeouts.
- Prefer a short watchdog (a few seconds) to avoid hiding real issues while still preventing suite-wide timeouts.
- Keep behavior consistent across Chromium/WebKit/Firefox.

### `tests/e2e/upload.spec.ts`

**Objective:** Avoid triggering blocked deletion by deleting the DB *after* the app opens it.

**Pseudocode:**
```pseudocode
BEFORE: goto('/upload') then clearIndexedDB(page)
AFTER:
  clearIndexedDB(page)
  goto('/upload')
```

(Apply the same pattern to any other tests that currently `goto()` before clearing.)

### `tests/e2e/preview.spec.ts` and `tests/e2e/download.spec.ts`

**Objective:** Keep test semantics the same while reducing blocked deletion risk.

**Pseudocode:**
```pseudocode
IF a test currently does:
  goto('/upload')
  clearIndexedDB(page)
THEN change to:
  clearIndexedDB(page)
  goto('/upload')
```

## 4. Regression Tests (E2E Only)

### Test: Clearing IndexedDB does not hang when DB is open

- **Preconditions:** Navigate to a page that opens the app DB (e.g. `/upload`).
- **Steps:**
  1. `await page.goto('/upload')`
  2. `await clearIndexedDB(page)`
- **Expected:** `clearIndexedDB` resolves quickly (no timeout), and subsequent navigation logic continues.

(If we prefer not to add a new test file, we can incorporate this assertion into an existing spec by measuring a small time budget around the helper call.)

## 5. Lessons Learned (Optional)

- When using browser storage APIs in E2E helpers, always handle **blocked** paths and add a **watchdog timeout** so helpers cannot hang the full suite.
