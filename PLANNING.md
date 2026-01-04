# PLANNING.md - FaviconForge

## Overview

FaviconForge is a web application that generates all required favicon formats from a single uploaded image. This planning document outlines the implementation phases to deliver a complete freemium favicon generator with Google OAuth authentication and Stripe payments.

**Business Model:** Freemium with lifetime premium access (€5 one-time)

- **Free:** Basic favicon formats (ICO, PNG 16/32/48)
- **Premium:** All formats including PWA, Apple, Windows + manifest customization

---

## Prerrequisitos (trabajo manual)

Antes de empezar, necesitas tener configurado:

- [x] Cuenta de Google Cloud Console con OAuth 2.0 credentials (Client ID + Secret)
- [x] Cuenta de Stripe (modo test) con API keys (Secret Key + Publishable Key)
- [x] Stripe Webhook endpoint configurado para recibir eventos de pago
- [x] Cuenta de Resend con API key para envío de emails (contact form)
- [x] Google Analytics 4 property creado con Measurement ID
- [x] Variables de entorno documentadas en `.env.example`:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `RESEND_API_KEY`
  - `GA_MEASUREMENT_ID`

---

## Phases

### Phase 0: Database & Premium Infrastructure

**🔴 Antes:** Database tiene schema básico de Better Auth (users, sessions, accounts, verifications). No hay campos para premium status ni Stripe.
**🟢 Después:** Users table tiene campos `isPremium`, `premiumSince`, `stripeCustomerId`. Helper functions para verificar premium status.

#### Task 0.1: Add premium fields to database schema

- [x] Add `isPremium` (boolean, default false) to users table in `app/db/schema/users.ts`
- [x] Add `premiumSince` (timestamp, nullable) to users table
- [x] Add `stripeCustomerId` (varchar, nullable) to users table
- [x] Generate migration with `npm run db:generate`
- [x] Run migration with `npm run db:migrate`
- [x] Verify migration applied correctly with manual DB check
- [x] Run `npm run typecheck` and `npm run lint` to verify no type errors

#### Task 0.2: Create premium status helpers

- [x] Create `app/services/premium.server.ts` with `isPremiumUser(userId: string): Promise<boolean>`
- [x] Create `getPremiumStatus(userId: string): Promise<{isPremium: boolean, premiumSince: Date | null}>`
- [x] Create `grantPremium(userId: string, stripeCustomerId: string): Promise<void>`
- [x] Add i18n keys for premium-related UI text (en.json and es.json)
- [x] Create test endpoint `app/routes/api.__test__.premium.tsx` for E2E testing
- [x] Write E2E tests in `tests/e2e/premium-service.spec.ts`
- [x] Run `npm run test:e2e -- --retries=1` and verify tests pass
- [x] Run `npm run typecheck` and `npm run lint`

---

### Phase 1: Image Upload & Validation

**🔴 Antes:** No hay funcionalidad de subida de imágenes. Landing page es genérica.
**🟢 Después:** Usuario puede subir imagen, se valida (formato, tamaño, aspecto), se almacena en sessionStorage, se redirige a preview.

#### Task 1.1: Create image validation service

- [x] Setup Vitest for unit testing (install vitest, @vitest/coverage-v8, jsdom; create vitest.config.ts; add npm scripts)
- [x] Create `app/services/imageValidation.ts` with validation functions
- [x] Implement `validateImageFile(file: File): ValidationResult` - checks format (PNG/JPEG/WebP)
- [x] Implement `validateImageDimensions(img: HTMLImageElement): ValidationResult` - checks 512x512 min, square
- [x] Implement `validateFileSize(file: File): ValidationResult` - checks max 10MB
- [x] Add i18n keys for all validation error messages (en.json and es.json)
- [x] Write unit tests in `tests/unit/imageValidation.test.ts`
- [x] Run `npm run test:unit` and verify tests pass
- [x] Run `npm run typecheck` and `npm run lint`

#### Task 1.2: Create upload route and component

- [x] Register `/upload` route in `app/routes.ts`
- [x] Create `app/routes/upload.tsx` with loader (no auth required)
- [x] Create upload components with drag-and-drop zone (UploadDropzone, state components)
- [x] Create `app/hooks/useImageUpload.ts` to handle file selection, validation, preview
- [x] Store validated image as base64 in sessionStorage
- [x] Redirect to `/preview` on successful upload
- [x] Add i18n keys for upload UI (title, drop zone text, requirements)
- [x] Run `npm run typecheck` and `npm run lint`
- [x] Write E2E test: upload valid image → redirects to preview
- [x] Write E2E test: upload invalid image → shows error message
- [x] Run `npm run test:e2e -- --retries=1` and verify tests pass

#### Task 1.3: Update landing page for FaviconForge

- [x] Update `app/routes/home.tsx` hero section with FaviconForge value proposition
- [x] Add CTA button linking to `/upload`
- [x] Add brief explanation of what formats are generated (free vs premium)
- [x] Add trust signals (no account needed for free tier, client-side processing)
- [x] Update i18n keys for new landing content
- [x] Run `npm run typecheck` and `npm run lint`
- [x] Create E2E tests for landing page
- [x] Run `npm run test:e2e -- --retries=1` and verify tests pass

---

### Phase 2: Favicon Generation & Preview

**🔴 Antes:** Imagen subida está en sessionStorage pero no hay generación de favicons ni vista previa.
**🟢 Después:** Usuario ve su favicon en múltiples contextos (browser tabs, iOS, Android, Windows). Todos los formatos generados client-side.

#### Task 2.1: Install favicon generation dependencies

- [ ] Install `jszip` for ZIP package generation
- [ ] Install `png-to-ico` for ICO file generation
- [ ] Verify bundle size impact is acceptable
- [ ] Run `npm run typecheck` and `npm run build` to verify no issues

#### Task 2.2: Create favicon generation service

- [ ] Create `app/services/faviconGeneration.ts`
- [ ] Implement `resizeImage(imageData: string, size: number): Promise<Blob>` using Canvas API
- [ ] Implement `generatePNGFormats(imageData: string): Promise<FaviconPNG[]>` - all PNG sizes
- [ ] Implement `generateICO(imageData: string): Promise<Blob>` - multi-resolution ICO
- [ ] Implement `generateManifest(options: ManifestOptions): string` - customizable manifest.json
- [ ] Implement `generateBrowserConfig(): string` - Windows browserconfig.xml
- [ ] Implement `generateHTMLSnippet(isPremium: boolean): string` - ready-to-use HTML code
- [ ] Write unit tests in `tests/unit/faviconGeneration.test.ts`
- [ ] Run `npm run test:unit` and verify tests pass
- [ ] Run `npm run typecheck` and `npm run lint`

#### Task 2.3: Create preview route and components

- [ ] Register `/preview` route in `app/routes.ts`
- [ ] Create `app/routes/preview.tsx` with loader (check sessionStorage has image, else redirect to /upload)
- [ ] Create `app/components/FaviconPreview.tsx` - container component
- [ ] Create `app/components/previews/BrowserTabPreview.tsx` - Chrome/Safari tab mockup
- [ ] Create `app/components/previews/IOSHomePreview.tsx` - iOS home screen mockup
- [ ] Create `app/components/previews/AndroidHomePreview.tsx` - Android home screen mockup
- [ ] Create `app/components/previews/WindowsTilePreview.tsx` - Windows Start menu mockup
- [ ] Create `app/components/previews/BookmarkPreview.tsx` - Bookmark bar mockup
- [ ] Create `app/hooks/useFaviconGeneration.ts` - orchestrates generation on preview load
- [ ] Add "Continue to Download" CTA button
- [ ] Add "Upload different image" link
- [ ] Add i18n keys for preview UI
- [ ] Run `npm run typecheck` and `npm run lint`
- [ ] Write E2E test: navigate to /preview with valid sessionStorage → previews render
- [ ] Write E2E test: navigate to /preview without sessionStorage → redirect to /upload
- [ ] Run `npm run test:e2e -- --retries=1` and verify tests pass

---

### Phase 3: ZIP Download (Free Tier)

**🔴 Antes:** Previews se muestran pero no hay forma de descargar los archivos.
**🟢 Después:** Usuario puede descargar ZIP con formatos básicos gratuitos (ICO, PNG 16/32/48). Premium formats visible pero bloqueados.

#### Task 3.1: Create ZIP generation service

- [ ] Create `app/services/zipGeneration.ts`
- [ ] Implement `generateFreeZip(faviconData: GeneratedFavicons): Promise<Blob>` - basic formats only
- [ ] Implement `generatePremiumZip(faviconData: GeneratedFavicons, manifestOptions: ManifestOptions): Promise<Blob>` - all formats
- [ ] Include proper folder structure as per PRD (web/, ios/, android/, windows/, pwa/)
- [ ] Include `snippet.html` with ready-to-use code
- [ ] Include `README.md` in premium ZIP only
- [ ] Write unit tests in `tests/unit/zipGeneration.test.ts`
- [ ] Run `npm run test:unit` and verify tests pass
- [ ] Run `npm run typecheck` and `npm run lint`

#### Task 3.2: Create download route and component

- [ ] Register `/download` route in `app/routes.ts`
- [ ] Create `app/routes/download.tsx` with loader (check sessionStorage, get user premium status if logged in)
- [ ] Create `app/components/DownloadSection.tsx` - two-column layout (free vs premium)
- [ ] Create `app/components/FreePackageCard.tsx` - shows free formats with download button
- [ ] Create `app/components/PremiumPackageCard.tsx` - shows premium formats with lock/unlock state
- [ ] Create `app/hooks/useDownload.ts` - handles ZIP generation and download trigger
- [ ] Implement free download (always available, triggers immediately)
- [ ] Show premium upsell for non-premium users
- [ ] Add i18n keys for download UI (package contents, CTAs, premium pitch)
- [ ] Run `npm run typecheck` and `npm run lint`
- [ ] Write E2E test: anonymous user downloads free ZIP → ZIP contains correct files
- [ ] Run `npm run test:e2e -- --retries=1` and verify tests pass

---

### Phase 4: Google OAuth (Premium Requirement)

**🔴 Antes:** Auth setup existe con email/password. Google OAuth está configurado pero no conectado al flujo premium.
**🟢 Después:** Usuario puede hacer login con Google. Solo Google OAuth disponible (sin email/password). Premium check funciona tras login.

#### Task 4.1: Configure Google-only authentication

- [ ] Update `app/lib/auth.ts` to make Google the only OAuth provider visible in UI
- [ ] Remove email/password signup option from UI (keep backend for existing users if any)
- [ ] Update `app/routes/auth.login.tsx` to show only Google button
- [ ] Update `app/routes/auth.signup.tsx` to show only Google button (or merge with login)
- [ ] Update header to show "Sign in with Google" when logged out
- [ ] Update i18n keys for Google-only auth
- [ ] Run `npm run typecheck` and `npm run lint`

#### Task 4.2: Integrate premium status with auth

- [ ] Update `app/routes/download.tsx` loader to fetch premium status for logged-in users
- [ ] Create `app/context/PremiumContext.tsx` to cache premium status client-side
- [ ] Update `PremiumPackageCard.tsx` to show different states:
  - Not logged in: "Sign in with Google to buy premium"
  - Logged in, not premium: "Buy Premium - €5"
  - Premium: Download button enabled
- [ ] Update i18n keys for premium states
- [ ] Run `npm run typecheck` and `npm run lint`
- [ ] Write E2E test: login with Google (mocked) → premium status reflected in UI
- [ ] Run `npm run test:e2e -- --retries=1` and verify tests pass

---

### Phase 5: Stripe Payment Integration

**🔴 Antes:** Usuario puede ver formatos premium pero no puede pagar.
**🟢 Después:** Usuario puede pagar €5 via Stripe Checkout. Webhook actualiza premium status. Usuario puede descargar premium ZIP.

#### Task 5.1: Create Stripe checkout endpoint

- [ ] Install `stripe` and `@stripe/stripe-js` packages
- [ ] Create `app/services/stripe.server.ts` with Stripe client initialization
- [ ] Create `app/routes/api.stripe.checkout.ts` - POST endpoint to create checkout session
- [ ] Validate user is authenticated before creating checkout
- [ ] Include user ID in checkout session metadata for webhook
- [ ] Configure success and cancel URLs
- [ ] Run `npm run typecheck` and `npm run lint`

#### Task 5.2: Create Stripe webhook handler

- [ ] Create `app/routes/api.stripe.webhook.ts` - POST endpoint to receive Stripe events
- [ ] Verify webhook signature with `STRIPE_WEBHOOK_SECRET`
- [ ] Handle `checkout.session.completed` event
- [ ] Extract user ID from session metadata
- [ ] Call `grantPremium(userId, stripeCustomerId)` to update database
- [ ] Handle idempotency (duplicate webhooks)
- [ ] Run `npm run typecheck` and `npm run lint`

#### Task 5.3: Create checkout flow UI

- [ ] Update `PremiumPackageCard.tsx` to trigger checkout API on "Buy Premium" click
- [ ] Add loading state while creating checkout session
- [ ] Redirect to Stripe Checkout on success
- [ ] Handle errors gracefully with user-friendly messages
- [ ] Add i18n keys for checkout flow
- [ ] Run `npm run typecheck` and `npm run lint`

#### Task 5.4: Create success page

- [ ] Register `/success` route in `app/routes.ts`
- [ ] Create `app/routes/success.tsx` - post-payment confirmation
- [ ] Show "Welcome to Premium!" message
- [ ] Explain lifetime access
- [ ] Auto-redirect to `/download` after 3 seconds (or manual link)
- [ ] Add i18n keys for success page
- [ ] Run `npm run typecheck` and `npm run lint`
- [ ] Write E2E test: mock Stripe webhook → user marked as premium → can download premium ZIP
- [ ] Run `npm run test:e2e -- --retries=1` and verify tests pass

---

### Phase 6: Premium Manifest Customization

**🔴 Antes:** Premium ZIP genera manifest.json con valores por defecto.
**🟢 Después:** Usuario premium puede personalizar app name, theme color, background color antes de descargar.

#### Task 6.1: Add manifest customization to download page

- [ ] Create `app/components/ManifestCustomizer.tsx` - form for app name, colors
- [ ] Add color pickers for theme_color and background_color
- [ ] Add text input for app short_name and name
- [ ] Only show customizer for premium users
- [ ] Store customization in component state (not persisted)
- [ ] Pass customization to ZIP generation
- [ ] Add i18n keys for customizer
- [ ] Run `npm run typecheck` and `npm run lint`
- [ ] Write E2E test: premium user customizes manifest → ZIP contains customized values
- [ ] Run `npm run test:e2e -- --retries=1` and verify tests pass

---

### Phase 7: Contact Form & Email

**🔴 Antes:** No hay forma de contactar al equipo.
**🟢 Después:** Página de contacto funcional con envío de emails via Resend.

#### Task 7.1: Create contact form route and service

- [ ] Install `resend` package
- [ ] Create `app/services/email.server.ts` with Resend client initialization
- [ ] Create `sendContactEmail(from: string, subject: string, message: string): Promise<void>`
- [ ] Register `/contact` route in `app/routes.ts`
- [ ] Create `app/routes/contact.tsx` with form and action handler
- [ ] Create `app/components/ContactForm.tsx` with name, email, message fields
- [ ] Implement form validation with Zod
- [ ] Show success toast on submission
- [ ] Add i18n keys for contact form
- [ ] Run `npm run typecheck` and `npm run lint`
- [ ] Write E2E test: fill contact form → submit → success message shown
- [ ] Run `npm run test:e2e -- --retries=1` and verify tests pass

---

### Phase 8: Legal Pages

**🔴 Antes:** No hay páginas legales.
**🟢 Después:** Terms of Service y Privacy Policy páginas disponibles.

#### Task 8.1: Create Terms of Service page

- [ ] Register `/terms` route in `app/routes.ts`
- [ ] Create `app/routes/terms.tsx` with static content
- [ ] Add terms content (can be placeholder initially, user to provide final copy)
- [ ] Add i18n keys for terms page (or keep English-only for legal docs)
- [ ] Run `npm run typecheck` and `npm run lint`

#### Task 8.2: Create Privacy Policy page

- [ ] Register `/privacy` route in `app/routes.ts`
- [ ] Create `app/routes/privacy.tsx` with static content
- [ ] Add privacy content (can be placeholder initially)
- [ ] Add i18n keys for privacy page (or keep English-only)
- [ ] Link to privacy/terms from footer
- [ ] Run `npm run typecheck` and `npm run lint`

---

### Phase 9: Google Analytics Integration

**🔴 Antes:** No hay tracking de eventos ni métricas.
**🟢 Después:** GA4 configurado con eventos según PRD (page views, uploads, downloads, payments).

#### Task 9.1: Set up GA4 tracking

- [ ] Add GA4 script to `app/root.tsx` (conditionally load based on env)
- [ ] Create `app/lib/analytics.ts` with `trackEvent(name: string, params?: object)` helper
- [ ] Implement page view tracking on route changes
- [ ] Run `npm run typecheck` and `npm run lint`

#### Task 9.2: Add event tracking throughout app

- [ ] Track `file_upload_start` on file selection
- [ ] Track `file_upload_success` on valid upload
- [ ] Track `file_upload_error` on validation failure
- [ ] Track `preview_view` on preview page load
- [ ] Track `download_free_click` and `download_free_complete`
- [ ] Track `premium_interest` when premium section is viewed
- [ ] Track `login_start` and `login_complete`
- [ ] Track `checkout_start` and `checkout_complete`
- [ ] Track `download_premium_complete`
- [ ] Track `contact_form_submit`
- [ ] Run `npm run typecheck` and `npm run lint`

---

### Phase 10: Polish & Accessibility

**🔴 Antes:** Funcionalidad completa pero sin pulir.
**🟢 Después:** WCAG 2.1 AA compliant, responsive en mobile, manejo de errores robusto.

#### Task 10.1: Accessibility audit and fixes

- [ ] Add proper ARIA labels to all interactive elements
- [ ] Ensure keyboard navigation works throughout the app
- [ ] Add focus indicators to all focusable elements
- [ ] Test with screen reader (VoiceOver)
- [ ] Ensure color contrast meets WCAG AA standards
- [ ] Run `npm run typecheck` and `npm run lint`

#### Task 10.2: Mobile responsive polish

- [ ] Test all pages on mobile viewports (320-400px)
- [ ] Ensure preview grid collapses to single column on mobile
- [ ] Test drag-and-drop on touch devices (fallback to tap)
- [ ] Ensure buttons and touch targets are 44x44px minimum
- [ ] Run `npm run typecheck` and `npm run lint`

#### Task 10.3: Error handling polish

- [ ] Ensure all error states have user-friendly messages
- [ ] Add fallback UI for processing errors
- [ ] Test network error scenarios
- [ ] Verify error messages are translated
- [ ] Run `npm run typecheck` and `npm run lint`
- [ ] Run full E2E test suite: `npm run test:e2e -- --retries=1`

---

## Implementation Order

Sequential list of all tasks in recommended order:

1. Task 0.1 - Add premium fields to database schema
2. Task 0.2 - Create premium status helpers
3. Task 1.1 - Create image validation service
4. Task 1.2 - Create upload route and component
5. Task 1.3 - Update landing page for FaviconForge
6. Task 2.1 - Install favicon generation dependencies
7. Task 2.2 - Create favicon generation service
8. Task 2.3 - Create preview route and components
9. Task 3.1 - Create ZIP generation service
10. Task 3.2 - Create download route and component
11. Task 4.1 - Configure Google-only authentication
12. Task 4.2 - Integrate premium status with auth
13. Task 5.1 - Create Stripe checkout endpoint
14. Task 5.2 - Create Stripe webhook handler
15. Task 5.3 - Create checkout flow UI
16. Task 5.4 - Create success page
17. Task 6.1 - Add manifest customization to download page
18. Task 7.1 - Create contact form route and service
19. Task 8.1 - Create Terms of Service page
20. Task 8.2 - Create Privacy Policy page
21. Task 9.1 - Set up GA4 tracking
22. Task 9.2 - Add event tracking throughout app
23. Task 10.1 - Accessibility audit and fixes
24. Task 10.2 - Mobile responsive polish
25. Task 10.3 - Error handling polish

---

## Risk Mitigation

| Risk                             | Impact                 | Mitigation                                                                           |
| -------------------------------- | ---------------------- | ------------------------------------------------------------------------------------ |
| Users bypass premium paywall     | Low revenue            | Accept risk; €5 not worth sophisticated protection. Client-side check is sufficient. |
| png-to-ico library compatibility | Broken ICO files       | Test extensively across browsers. Have fallback messaging.                           |
| Large images crash browser       | Poor UX                | 10MB limit, processing indicator, try-catch for Canvas errors.                       |
| Stripe webhook delivery issues   | Missing premium grants | Implement retry logic, monitor webhook logs, manual recovery process.                |
| Google OAuth downtime            | Can't purchase         | Show clear error, suggest trying later. Premium not required for free tier.          |
| SessionStorage limits            | Lost upload            | Base64 images can be large. Consider chunking or warn if approaching limit.          |

---

## Open Questions

- [ ] Final domain name for FaviconForge
- [ ] Hosting decision (Vercel vs Railway vs other)
- [ ] Final copy for Terms of Service and Privacy Policy
- [ ] Refund policy details (suggested: manual review, case by case)
- [ ] Support email address for contact form

---

## Progress Tracker

| Phase | Task | Status         | Notes               |
| ----- | ---- | -------------- | ------------------- |
| 0     | 0.1  | ✅ Complete    | Database schema     |
| 0     | 0.2  | ✅ Complete    | Premium helpers     |
| 1     | 1.1  | ✅ Complete    | Image validation    |
| 1     | 1.2  | ✅ Complete    | Upload route        |
| 1     | 1.3  | ✅ Complete    | Landing page        |
| 2     | 2.1  | ⬜ Not Started | Dependencies        |
| 2     | 2.2  | ⬜ Not Started | Favicon service     |
| 2     | 2.3  | ⬜ Not Started | Preview route       |
| 3     | 3.1  | ⬜ Not Started | ZIP service         |
| 3     | 3.2  | ⬜ Not Started | Download route      |
| 4     | 4.1  | ⬜ Not Started | Google-only auth    |
| 4     | 4.2  | ⬜ Not Started | Premium integration |
| 5     | 5.1  | ⬜ Not Started | Stripe checkout     |
| 5     | 5.2  | ⬜ Not Started | Stripe webhook      |
| 5     | 5.3  | ⬜ Not Started | Checkout UI         |
| 5     | 5.4  | ⬜ Not Started | Success page        |
| 6     | 6.1  | ⬜ Not Started | Manifest customizer |
| 7     | 7.1  | ⬜ Not Started | Contact form        |
| 8     | 8.1  | ⬜ Not Started | Terms page          |
| 8     | 8.2  | ⬜ Not Started | Privacy page        |
| 9     | 9.1  | ⬜ Not Started | GA4 setup           |
| 9     | 9.2  | ⬜ Not Started | Event tracking      |
| 10    | 10.1 | ⬜ Not Started | Accessibility       |
| 10    | 10.2 | ⬜ Not Started | Mobile polish       |
| 10    | 10.3 | ⬜ Not Started | Error handling      |

**Status Legend:** ⬜ Not Started | 🔄 In Progress | ✅ Complete | ⏸️ Blocked

---

_Document created: 2025-12-31_
_Based on PRD v1.0_
