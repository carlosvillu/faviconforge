# FEATURE_9.2_GA4EventTracking

## 1. Natural Language Description

### Current state

The app already loads GA4 conditionally (only when `GA_MEASUREMENT_ID` is present and cookie consent is accepted) and tracks `page_view` events on route changes.

However, it does not yet track key funnel/product events (upload, preview, downloads, premium interest, login, checkout, contact) required by Phase 9.

### Expected end state

When a user interacts with the app, we emit GA4 events (prefixed with `ff_`) via the existing `trackEvent` helper, including useful parameters for segmentation.

Tracking must:

- Respect cookie consent (already enforced by `trackEvent` being a no-op unless GA is initialized)
- Be placed close to the user interaction / domain action (hooks/components), not in route modules
- Avoid double-firing on rerenders (use effects/guards only where needed)

## 2. Technical Description

We will instrument the app by calling `trackEvent` from the existing analytics module.

Key decisions:

- **Event naming:** all events are prefixed with `ff_` to avoid collisions.
- **Event parameters:** include small, consistent metadata per event to support funnel analysis.
- **Placement:** prefer hooks/components where the action happens:
  - upload lifecycle -> `useImageUpload`
  - preview view / generation -> `PreviewPage` and/or `useFaviconGeneration`
  - download click/complete -> `DownloadActionBar` + `useDownload`
  - premium interest -> `PremiumPackageCard` selection
  - login start -> `GoogleAuthButton`
  - login complete -> a lightweight client-side detector of “session is now present” after OAuth redirect
  - checkout start/complete -> `useCheckout` + `SuccessPage`
  - contact submit -> `useContactForm`

## 2.1. Architecture Gate

- **Pages are puzzles:** route modules should remain composition-focused; event tracking is mostly added to hooks/components where interactions occur.
- **Loaders/actions are thin:** no domain/event logic added to loaders/actions.
- **Business logic is not in components:** no analytics “business rules” in route modules; keep tracking near interaction in hooks/components.

## 3. Files to Change/Create

### `app/lib/analytics.ts`

**Objective:** Provide a small, typed set of event helpers so call sites don’t handcraft names/params inconsistently.

**Pseudocode:**

```pseudocode
ADD exported helpers (thin wrappers around trackEvent)
  FUNCTION trackFFEvent(name, params)
    CALL trackEvent('ff_' + name, params)
  END

  (optional) define a union type for known ff event names
END
```

### `app/hooks/useImageUpload.ts`

**Objective:** Track upload lifecycle events.

**Pseudocode:**

```pseudocode
IN handleFileDrop(acceptedFiles)
  DETERMINE source = dropzone (since react-dropzone uses onDrop)
  IF file exists
    track ff_file_upload_start with:
      file_type, file_size_mb, source

    result = validateImage(file)

    IF result.valid
      track ff_file_upload_success with:
        file_type, file_size_mb
    ELSE
      track ff_file_upload_error with:
        error_key
    END
  END
END

IN handleContinue()
  (no new event required by task list)
END
```

### `app/routes/preview.tsx`

**Objective:** Track that the preview page has been viewed.

**Pseudocode:**

```pseudocode
COMPONENT PreviewPage
  ON first mount when hasSourceImage === true
    track ff_preview_view with:
      has_source_image: true
  END
END
```

### `app/components/preview/PreviewActions.tsx`

**Objective:** Track user intent to proceed to download.

**Pseudocode:**

```pseudocode
COMPONENT PreviewActions
  ON click download
    track ff_download_nav_click with:
      from: 'preview'
    CALL onDownload()
  END
END
```

### `app/hooks/useDownload.ts`

**Objective:** Track download completion events for both tiers.

**Pseudocode:**

```pseudocode
IN triggerDownload()
  DETERMINE tier = selectedTier

  (optional) track click intent here OR in DownloadActionBar (avoid double fire)

  result = generateZip() if needed
  IF no blob/filename
    RETURN
  END

  CREATE object URL and click <a>

  IF tier === 'free'
    track ff_download_free_complete with:
      tier: 'free', warnings_count, zip_filename
  ELSE
    track ff_download_premium_complete with:
      tier: 'premium', warnings_count, zip_filename
  END
END
```

### `app/components/download/DownloadActionBar.tsx`

**Objective:** Track click events for initiating a free download.

**Pseudocode:**

```pseudocode
COMPONENT DownloadActionBar
  IF showFreeDownload
    ON click
      track ff_download_free_click with:
        tier: 'free'
      CALL onDownload()
    END
  END
END
```

### `app/components/download/PremiumPackageCard.tsx`

**Objective:** Track premium interest when user selects premium tier (Option A).

**Pseudocode:**

```pseudocode
COMPONENT PremiumPackageCard
  ON click (onSelect)
    track ff_premium_interest with:
      location: 'download'
    CALL onSelect()
  END
END
```

### `app/components/GoogleAuthButton.tsx`

**Objective:** Track login/signup start when user clicks the Google button.

**Pseudocode:**

```pseudocode
IN handleClick()
  track ff_login_start with:
    provider: 'google', mode, redirect_to: callbackURL
  CALL signIn.social(...)
END
```

### `app/hooks/useLoginCompleteTracking.ts` (new)

**Objective:** Track `ff_login_complete` after OAuth redirect when the app has a session.

**Notes:**

- Login completion happens across redirects, so the most reliable client-side signal is: **session becomes present**.
- The root loader already provides `session`/`user` to `Header`, so we can also use the same loader data to infer “logged in now”.

**Pseudocode:**

```pseudocode
HOOK useLoginCompleteTracking(params)
  INPUT: session, user, location

  IF session is present AND a local "alreadyTracked" flag is false
    (optional) only if location.search includes a specific marker
    track ff_login_complete with:
      provider: 'google'
    mark alreadyTracked = true
  END
END
```

### `app/root.tsx`

**Objective:** Wire `useLoginCompleteTracking` close to the source of truth for `session/user`.

**Pseudocode:**

```pseudocode
COMPONENT App
  CALL useLoginCompleteTracking({ session: loaderData.session, user: loaderData.user, location })
END
```

### `app/hooks/useCheckout.ts`

**Objective:** Track checkout start.

**Pseudocode:**

```pseudocode
IN startCheckout()
  track ff_checkout_start with:
    tier: 'premium', price_eur: 5
  CALL /api/stripe/checkout
  IF url returned
    (optional) track ff_checkout_redirect with: has_url: true
    redirect
  END
END
```

### `app/routes/success.tsx`

**Objective:** Track checkout completion.

**Pseudocode:**

```pseudocode
COMPONENT SuccessPage
  ON mount
    track ff_checkout_complete with:
      tier: 'premium', price_eur: 5
  END
END
```

### `app/hooks/useContactForm.ts`

**Objective:** Track contact form submission.

**Pseudocode:**

```pseudocode
IN handleSubmit(data)
  track ff_contact_form_submit with:
    has_email: true
  CALL /api/contact
  (no need for extra success/failure event in this task)
END
```

## 4. E2E Test Plan (or Unit Test Plan)

This task will **not add new tests for now** (per decision). It is instrumentation-only.

We will rely on:

- `npm run typecheck`
- `npm run lint`

Optionally (manual sanity checks):

- Verify events appear in GA4 DebugView (with consent accepted and `GA_MEASUREMENT_ID` configured)
- Verify no events fire when consent is rejected/unset

## 5. Definition of Done

- `ff_*` events are emitted for all items listed in Task 9.2 (with parameters as defined above)
- No double-firing on rerenders for view-type events (`ff_preview_view`, `ff_login_complete`, `ff_checkout_complete`)
- `npm run typecheck` passes
- `npm run lint` passes
