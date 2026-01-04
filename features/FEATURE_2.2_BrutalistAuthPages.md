# FEATURE_2.2_BrutalistAuthPages.md

## 1. Natural Language Description

### Current State (Before)
The app has working `/auth/login` and `/auth/signup` pages implemented as route modules.

- The UI is currently a centered shadcn `Card` with standard shadcn styling (rounded corners, subtle borders, neutral theme tokens).
- Login includes a small OAuth error mapping from query param `?error=...`, but the UX is not aligned with the brutalist style.
- Auth pages use a shared `GoogleAuthButton`.
- Header/Footer are already handled at the app layout level and should remain consistent across the site.

### Expected End State (After)
Login and Signup pages keep the **same global app layout** (shared Header/Footer) but the **central card** is redesigned to match the brutalist mockup style:

- Thick borders (4px/8px), sharp corners, high contrast (black/white/yellow), strong typography (uppercase, `font-black` headings, `font-bold` body).
- No “soft UI” (no `rounded-*`, no subtle `shadow-*`), following `docs/STYLE_GUIDE.md`.
- Components are refactored into **small, reusable, composable** UI pieces (no mega route modules).
- Login shows an additional **info block** when `?error=user_not_found|signup_disabled` (OAuth login attempted but account doesn’t exist), guiding the user to Signup.
- The pages are **Google-only** (no email/password login/signup UI).

### Acceptance Criteria
- [ ] `/auth/login` and `/auth/signup` central card follows brutalist visual system (borders, fonts, colors, uppercase).
- [ ] The auth UX is Google-only and preserves the existing redirect behavior via `redirect` query param.
- [ ] The OAuth login button is re-styled to brutalist style.
- [ ] Login renders an info callout for the OAuth “no account” error states.
- [ ] Routes stay thin and do not become “god components”.
- [ ] `npm run test:e2e -- --retries=1` passes.
- [ ] `npm run typecheck` passes.
- [ ] `npm run lint` passes.

---

## 2. Technical Description

We will refactor the auth route modules to be mostly composition, extracting a small set of reusable auth UI components.

Key decisions:

- Auth is **Google-only**.
- Keep Better Auth client usage as-is (`signIn.social`).
- Use existing shadcn primitives already in the repo: `card`, `button`, `alert`.
- Implement brutalist styling via `className` overrides on these components and on new auth-specific presentational wrappers.
- Implement the login OAuth error mapping in a small hook/util module so the route stays thin.

### 2.1. Architecture Gate (REQUIRED)

- **Pages are puzzles:**
  - `app/routes/auth.login.tsx` and `app/routes/auth.signup.tsx` will only compose existing components + hook(s), and keep minimal JSX.
- **Loaders/actions are thin:**
  - These routes are currently client-only; no new loader/action logic is introduced in this task.
- **Business logic is not in components:**
  - Auth calls remain in the route module submit handler or can be moved into a small service if needed later.
  - UI orchestration (OAuth error mapping) should live in a custom hook (`app/hooks/*`) or a tiny `app/lib/*` helper.
  - Presentational layout/blocks will live in `app/components/*`.

---

## 3. Files to Change/Create

### `app/routes/auth.login.tsx`
**Objective:** Convert the login page into a thin composition module that renders a brutalist auth card and shows an OAuth info callout when applicable.

**Pseudocode:**
```pseudocode
LOADER: N/A
ACTION: N/A

COMPONENT LoginPage
  INIT t, navigate, searchParams
  oauthInfo = useLoginOAuthInfo(searchParams, t)
  // oauthInfo could contain:
  // - infoMessage?: string
  // - errorMessage?: string (optional if we want to centralize)

  RENDER AuthCardShell
    RENDER AuthCardHeader(title=t('login_title'), subtitle optional)
    RENDER GoogleAuthButton (restyled) with callbackURL

    IF oauthInfo.infoMessage
      RENDER AuthInfoCallout(message=oauthInfo.infoMessage)

    RENDER SwitchAuthLink -> /auth/signup (reuse existing i18n keys)
END
```

### `app/routes/auth.signup.tsx`
**Objective:** Convert the signup page into a thin composition module that shares the same brutalist auth card components.

**Pseudocode:**
```pseudocode
LOADER: N/A
ACTION: N/A

COMPONENT SignupPage
  INIT t, navigate, searchParams
  RENDER AuthCardShell
    RENDER AuthCardHeader(title=t('signup_title'))
    RENDER GoogleAuthButton (restyled) with callbackURL

    RENDER SwitchAuthLink -> /auth/login
END
```

### `app/components/auth/AuthCardShell.tsx`
**Objective:** Provide the outer wrapper around the centered auth card that matches the mockup pattern while still respecting global app layout.

**Pseudocode:**
```pseudocode
COMPONENT AuthCardShell
  PROPS: children

  RENDER div
    className includes:
      min-h-[calc(100vh-...)] (or simply min-h-screen if already safe)
      flex items-center justify-center px-4 py-12
      bg-white OR bg-yellow-300 (match mockup pattern; pick ONE and keep consistent)

    RENDER Card (shadcn) but with brutalist overrides:
      border-8 border-black
      rounded-none
      shadow-none
      optional rotate-[1deg] (subtle) if desired

      children
END
```

### `app/components/auth/AuthCardHeader.tsx`
**Objective:** Brutalist header block for auth cards (title + optional small tagline).

**Pseudocode:**
```pseudocode
COMPONENT AuthCardHeader
  PROPS: title: string, subtitle?: string

  RENDER CardHeader
    title: uppercase font-black, large size
    optional subtitle: font-bold with left border accent (border-l-8 border-black pl-4)
END
```

### `app/components/auth/AuthInfoCallout.tsx`
**Objective:** Brutalist info block shown on login when OAuth login was attempted but no account exists.

**Notes:** Use shadcn `Alert` component already present in `app/components/ui/alert.tsx`, but override classes to brutalist (no rounding, thick border, high contrast).

**Pseudocode:**
```pseudocode
COMPONENT AuthInfoCallout
  PROPS: title, message, actionLink? (optional)

  RENDER Alert
    className: rounded-none border-4 border-black bg-yellow-300 text-black
    RENDER AlertTitle: uppercase font-black
    RENDER AlertDescription: font-bold

    OPTIONAL: render Link to /auth/signup (styled like brutalist inline link)
END
```

### `app/components/auth/AuthErrorCallout.tsx`
**Objective:** Standardize how errors are rendered for auth pages (OAuth redirect errors), matching brutalist patterns.

**Notes:** Use `Alert` with `variant="destructive"` or a custom red style.

**Pseudocode:**
```pseudocode
COMPONENT AuthErrorCallout
  PROPS: message

  RENDER Alert
    className: rounded-none border-4 border-red-600 bg-white text-red-600
    RENDER AlertTitle: uppercase font-black
    RENDER AlertDescription: font-bold
END
```

### `app/hooks/useLoginOAuthInfo.ts`
**Objective:** Encapsulate mapping from `searchParams.get('error')` to an info message for the login page.

**Pseudocode:**
```pseudocode
HOOK useLoginOAuthInfo
  INPUT: searchParams, t

  READ oauthError = searchParams.get('error')

  IF oauthError is null
    RETURN { infoMessage: null }

  IF oauthError in ['user_not_found', 'signup_disabled']
    RETURN { infoMessage: t('oauth_no_account') }

  RETURN { infoMessage: t('oauth_error') }
END
```

### `app/components/GoogleAuthButton.tsx`
**Objective:** Update the visual styling to match brutalist buttons while keeping behavior unchanged.

**Pseudocode:**
```pseudocode
COMPONENT GoogleAuthButton
  PROPS: mode, callbackURL

  ON click
    set loading
    call signIn.social with correct params

  RENDER Button
    variant: keep existing or use "default"
    className overrides:
      w-full
      border-4 border-black
      rounded-none
      bg-black text-yellow-300
      font-black uppercase
      hover translate/press effect (hover:translate-x-1 hover:translate-y-1)

  LABEL:
    if loading -> t('google_connecting')
    else -> t('google_continue')
END
```

### (Optional) `app/components/ui/separator.tsx` (shadcn)
**Objective:** If we prefer a shadcn component over custom divider markup, add `separator` via shadcn registry.

**Pseudocode:**
```pseudocode
IF project needs Separator
  ADD shadcn separator component
  USE <Separator className="h-1 bg-black" />
END
```

---

## 4. I18N

#### Existing keys to reuse
- `login_title`
- `signup_title`
- `google_continue`
- `have_account_prompt`
- `no_account_prompt`
- `login_link`
- `signup_link`

#### New keys to create
| Key | English | Spanish |
|-----|---------|---------|
| `google_connecting` | Connecting to Google... | Conectando con Google... |
| `oauth_no_account` | No account found for this Google email. Create an account first. | No existe una cuenta para este email de Google. Crea una cuenta primero. |
| `oauth_error` | Google sign-in failed. Please try again. | Error al iniciar sesión con Google. Inténtalo de nuevo. |

---

## 5. E2E Test Plan

### Test: Clicking Google button initiates redirect to Google OAuth
- **Preconditions:** Google OAuth is configured in the local/test environment (the button is expected to trigger a navigation).
- **Steps:**
  1. Navigate to `/auth/login`
  2. Click the "Continue with Google" button
  3. Wait for navigation to start and assert the browser is redirected to Google OAuth
     - Preferred assertion: `await page.waitForURL(/accounts\\.google\\.com/, { timeout: 10000 })`
     - Alternative (if the environment redirects through an internal route first): assert URL matches `/api/auth/` then eventually `accounts.google.com`
- **Expected result:** The browser navigates away from the app domain and the URL contains `accounts.google.com`.

### Test: Signup page uses Google "requestSignUp" mode
- **Preconditions:** None
- **Steps:**
  1. Navigate to `/auth/signup`
  2. Click the "Continue with Google" button
  3. Assert the first navigation/request hits an internal Better Auth route under `/api/auth/` and that it includes a signal for signup intent (e.g. `requestSignUp=true`)
- **Expected result:** Signup initiates Google OAuth with explicit signup intent.

### Test: Login page renders brutalist info block for OAuth no-account error
- **Preconditions:** None
- **Steps:**
  1. Navigate to `/auth/login?error=user_not_found`
  2. Assert an info callout is visible (by role `alert` or by text `oauth_no_account` in English)
- **Expected result:** The info callout renders and includes a link to `/auth/signup`.

### Test: Signup and Login flows still work
 - **Preconditions:** None
 - **Steps:** Re-run existing auth smoke coverage (page loads, Google button visible) and the redirect initiation tests.
 - **Expected result:**
   - Both pages load
   - Google button is visible on both pages
   - Clicking Google initiates redirect (without trying to complete OAuth)

---

## 6. Definition of Done (CRITICAL)

1. `npm run test:e2e -- --retries=1` passes
2. `npm run typecheck` passes
3. `npm run lint` passes
4. Acceptance criteria from section 1 are met

---

_Planning created: 2026-01-04_
_Based on PLANNING.md Task 2.2_
