# FEATURE_5.3_CheckoutFlow.md

## 1. Natural Language Description

We will implement the checkout flow UI to allow users to purchase the Premium package.
Currently, the "Buy Premium" button in the download page is disabled.
After this task:
- When a logged-in non-premium user selects the "Premium" tier, the "Buy Premium" button will be active.
- Clicking "Buy Premium" will trigger a request to the server to create a Stripe Checkout session.
- The user will see a loading state (text similar to "Redirecting to Stripe...").
- On success, the user will be redirected to the Stripe Checkout page.
- Errors will be handled gracefully with a toast or alert.

## 2. Technical Description

We will create a custom hook `useCheckout` to manage the interaction with the `/api/stripe/checkout` endpoint.
This hook will expose a `startCheckout` function and `isLoading` / `error` states.
We will update `DownloadActionBar` to accept an `onBuyPremium` handler and loading state.
We will wire everything in `app/routes/download.tsx`.

## 2.1. Architecture Gate

- **Pages are puzzles:** `download.tsx` composes `DownloadActionBar` and uses `useCheckout`.
- **Loaders/actions are thin:** N/A (client-side interaction).
- **Business logic is not in components:** `useCheckout` handles the API call and redirect logic. `DownloadActionBar` is presentational.

## 3. Files to Change/Create

### `app/hooks/useCheckout.ts`
**Objective:** Handle the checkout API call and redirection.

**Pseudocode:**
```pseudocode
HOOK useCheckout
  STATE isLoading = false
  STATE error = null

  FUNCTION startCheckout
    SET isLoading = true
    SET error = null
    
    TRY
      RESPONSE = FETCH POST /api/stripe/checkout
      
      IF RESPONSE is not ok
        THROW error

      DATA = AWAIT RESPONSE.json()
      
      IF DATA.url
        REDIRECT window.location.href = DATA.url
      ELSE
        THROW error "No URL returned"
        
    CATCH err
      SET error = err.message
      SET isLoading = false
      SHOW toast error (optional)
      
  RETURN { startCheckout, isLoading, error }
END
```

### `app/components/download/DownloadActionBar.tsx`
**Objective:** Enable the "Buy Premium" button and handle loading state.

**Pseudocode:**
```pseudocode
COMPONENT DownloadActionBar
  PROPS:
    ...existing props
    onBuyPremium: () => void
    isCheckoutLoading: boolean

  RENDER
    ...
    IF showBuyButton
      BUTTON
        onClick = onBuyPremium
        disabled = isCheckoutLoading
        TEXT = isCheckoutLoading ? t('checkout_redirecting') : t('download_buy_cta')
    ...
END
```

### `app/routes/download.tsx`
**Objective:** Integrate `useCheckout` and pass handler to `DownloadActionBar`.

**Pseudocode:**
```pseudocode
COMPONENT DownloadPage
  ...
  const checkout = useCheckout()
  
  RENDER
    ...
    DownloadActionBar
      onBuyPremium = checkout.startCheckout
      isCheckoutLoading = checkout.isLoading
    ...
END
```

## 4. I18N

### Existing keys to reuse
- `download_buy_cta`
- `download_buy_subtitle`

### New keys to create
| Key | English | Spanish |
|-----|---------|---------|
| `checkout_redirecting` | Redirecting to Stripe... | Redirigiendo a Stripe... |
| `checkout_error_generic` | Error starting checkout. Please try again. | Error al iniciar el pago. Por favor intenta de nuevo. |

## 5. E2E Test Plan

### Test: User can initiate checkout
- **Preconditions:** User is logged in, NOT premium.
- **Steps:**
  1. Navigate to `/download` (with a valid image in session storage).
  2. Select "Premium" tier.
  3. Click "Buy Premium".
- **Expected:**
  - Button text changes to "Redirecting to Stripe..." or disabled state.
  - (Mocking the API) window location changes to the checkout URL.

### Test: Checkout error handling
- **Preconditions:** User is logged in, NOT premium. API returns 500.
- **Steps:**
  1. Click "Buy Premium".
- **Expected:**
  - Error message shown (toast or alert).
  - Button reverts to "Buy Premium".

## 6. Definition of Done
1. **ALL relevant tests pass:**
   - `npm run test:e2e -- --retries=1`
   - `npm run test:unit`
2. `npm run typecheck` passes
3. `npm run lint` passes
4. Checkout flow works manually (user reaches Stripe).
