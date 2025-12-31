# PLANNING.md - FaviconForge

## Overview

FaviconForge is a freemium web application that generates all required favicon formats from a single uploaded image. Users upload a square image (512x512 minimum) and receive a complete ZIP package with properly formatted favicon files and ready-to-use HTML code.

**Business Model:**
- **Free tier (anonymous):** Basic formats (ICO, PNG 16/32/48)
- **Premium tier (€5 one-time):** All formats including PWA, Apple, Windows + manifest.json customization

**Key Technical Decisions:**
- All image processing happens client-side (Canvas API + JSZip + png-to-ico)
- No image data persists to server
- Stripe Checkout with webhooks for reliable payment handling
- Google OAuth only (via existing Better Auth setup)
- Device frame previews for realistic favicon visualization

---

## Phases

### Phase 0: Foundation & Database Schema

**Goal:** Extend the existing database schema to support premium users and prepare the project structure.
**Prerequisite:** None

#### Tasks

##### Task 0.1: Extend User Schema for Premium

**Objective:** Add premium-related columns to the users table.
**Baby Step Checkpoint:** ✅ Tests | ✅ Lint | ✅ Types

**Subtasks:**
- [ ] 0.1.1 - Add `is_premium` boolean column (default: false)
- [ ] 0.1.2 - Add `premium_since` timestamp column (nullable)
- [ ] 0.1.3 - Add `stripe_customer_id` varchar column (nullable)
- [ ] 0.1.4 - Generate and run database migration

**Files to modify/create:**
- `app/db/schema/users.ts` - Add new columns to users table
- `drizzle/migrations/XXXX_add_premium_fields.sql` - Generated migration

---

##### Task 0.2: Install Required Dependencies

**Objective:** Add npm packages for image processing, ZIP generation, and payments.
**Baby Step Checkpoint:** ✅ Tests | ✅ Lint | ✅ Types

**Subtasks:**
- [ ] 0.2.1 - Install `jszip` for ZIP file generation
- [ ] 0.2.2 - Install `png-to-ico` for ICO file generation
- [ ] 0.2.3 - Install `stripe` and `@stripe/stripe-js` for payments
- [ ] 0.2.4 - Install `resend` for contact form emails

**Files to modify/create:**
- `package.json` - Add dependencies

---

##### Task 0.3: Add Environment Variables Documentation

**Objective:** Document all required environment variables for the project.
**Baby Step Checkpoint:** ✅ Tests | ✅ Lint | ✅ Types

**Subtasks:**
- [ ] 0.3.1 - Add Stripe variables to .env.example
- [ ] 0.3.2 - Add Resend API key to .env.example
- [ ] 0.3.3 - Add GA4 measurement ID to .env.example
- [ ] 0.3.4 - Update docs/DEPLOYMENT.md with new variables

**Files to modify/create:**
- `.env.example` - Add new environment variables
- `docs/DEPLOYMENT.md` - Document new variables

---

### Phase 1: Core Image Processing Engine

**Goal:** Build the client-side image processing pipeline that generates all favicon formats.
**Prerequisite:** Phase 0

#### Tasks

##### Task 1.1: Create Image Validation Service

**Objective:** Validate uploaded images meet requirements (512x512 min, square, PNG/JPEG/WebP, <10MB).
**Baby Step Checkpoint:** ✅ Tests | ✅ Lint | ✅ Types

**Subtasks:**
- [ ] 1.1.1 - Create `app/services/image-validation.ts` with validation logic
- [ ] 1.1.2 - Validate file type (PNG, JPEG, WebP only)
- [ ] 1.1.3 - Validate file size (<10MB)
- [ ] 1.1.4 - Validate dimensions (512x512 minimum, must be square)
- [ ] 1.1.5 - Return structured error codes for each validation failure

**Files to modify/create:**
- `app/services/image-validation.ts` - Image validation service

---

##### Task 1.2: Create Canvas Resizing Service

**Objective:** Resize uploaded image to all required favicon sizes using Canvas API.
**Baby Step Checkpoint:** ✅ Tests | ✅ Lint | ✅ Types

**Subtasks:**
- [ ] 1.2.1 - Create `app/services/canvas-resize.ts` with resizing logic
- [ ] 1.2.2 - Implement resize function that returns PNG blob for any target size
- [ ] 1.2.3 - Add high-quality image scaling (imageSmoothingQuality: 'high')
- [ ] 1.2.4 - Create helper to generate all free tier sizes (16, 32, 48)
- [ ] 1.2.5 - Create helper to generate all premium sizes (180, 192, 512, 150)

**Files to modify/create:**
- `app/services/canvas-resize.ts` - Canvas resizing service

---

##### Task 1.3: Create ICO Generation Service

**Objective:** Generate multi-resolution ICO file from PNG images using png-to-ico.
**Baby Step Checkpoint:** ✅ Tests | ✅ Lint | ✅ Types

**Subtasks:**
- [ ] 1.3.1 - Create `app/services/ico-generator.ts`
- [ ] 1.3.2 - Implement ICO generation with 16x16, 32x32, and 48x48 layers
- [ ] 1.3.3 - Handle png-to-ico library integration (browser-compatible)
- [ ] 1.3.4 - Return ICO as Blob

**Files to modify/create:**
- `app/services/ico-generator.ts` - ICO file generation service

---

##### Task 1.4: Create Manifest Generator Service

**Objective:** Generate manifest.json and browserconfig.xml files for premium users.
**Baby Step Checkpoint:** ✅ Tests | ✅ Lint | ✅ Types

**Subtasks:**
- [ ] 1.4.1 - Create `app/services/manifest-generator.ts`
- [ ] 1.4.2 - Generate manifest.json with customizable: name, short_name, theme_color, background_color
- [ ] 1.4.3 - Generate browserconfig.xml for Windows tiles
- [ ] 1.4.4 - Return files as strings

**Files to modify/create:**
- `app/services/manifest-generator.ts` - PWA manifest generation service

---

##### Task 1.5: Create ZIP Packaging Service

**Objective:** Package all generated files into a downloadable ZIP using JSZip.
**Baby Step Checkpoint:** ✅ Tests | ✅ Lint | ✅ Types

**Subtasks:**
- [ ] 1.5.1 - Create `app/services/zip-packager.ts`
- [ ] 1.5.2 - Implement free tier ZIP structure (web/ folder only)
- [ ] 1.5.3 - Implement premium tier ZIP structure (web/, ios/, android/, windows/, pwa/)
- [ ] 1.5.4 - Generate snippet.html with implementation instructions
- [ ] 1.5.5 - Generate README.md for premium (localized based on user's locale)
- [ ] 1.5.6 - Return ZIP as Blob for download

**Files to modify/create:**
- `app/services/zip-packager.ts` - ZIP packaging service

---

##### Task 1.6: Create Favicon Generation Orchestrator Hook

**Objective:** Create a React hook that orchestrates the entire favicon generation pipeline.
**Baby Step Checkpoint:** ✅ Tests | ✅ Lint | ✅ Types

**Subtasks:**
- [ ] 1.6.1 - Create `app/hooks/useFaviconGenerator.ts`
- [ ] 1.6.2 - Manage generation state (idle, processing, complete, error)
- [ ] 1.6.3 - Expose `generate(image, options)` function
- [ ] 1.6.4 - Track progress percentage for UI feedback
- [ ] 1.6.5 - Handle errors gracefully with user-friendly messages

**Files to modify/create:**
- `app/hooks/useFaviconGenerator.ts` - Favicon generation orchestrator hook

---

### Phase 2: Upload & Preview UI

**Goal:** Build the upload interface and preview mockups for favicon visualization.
**Prerequisite:** Phase 1

#### Tasks

##### Task 2.1: Create Image Upload Component

**Objective:** Build drag-and-drop image upload component with validation feedback.
**Baby Step Checkpoint:** ✅ Tests | ✅ Lint | ✅ Types

**Subtasks:**
- [ ] 2.1.1 - Create `app/components/ImageUploader.tsx`
- [ ] 2.1.2 - Implement drag-and-drop zone with visual feedback
- [ ] 2.1.3 - Add file picker fallback button
- [ ] 2.1.4 - Display requirements (512x512 min, square, PNG/JPEG/WebP)
- [ ] 2.1.5 - Show inline error messages for validation failures
- [ ] 2.1.6 - Store uploaded image in sessionStorage (base64)

**Files to modify/create:**
- `app/components/ImageUploader.tsx` - Image upload component

---

##### Task 2.2: Create Device Frame Preview Components

**Objective:** Build realistic device frame mockups showing favicon in context.
**Baby Step Checkpoint:** ✅ Tests | ✅ Lint | ✅ Types

**Subtasks:**
- [ ] 2.2.1 - Create `app/components/previews/BrowserTabPreview.tsx` (Chrome, Safari)
- [ ] 2.2.2 - Create `app/components/previews/iOSHomeScreenPreview.tsx`
- [ ] 2.2.3 - Create `app/components/previews/AndroidHomeScreenPreview.tsx`
- [ ] 2.2.4 - Create `app/components/previews/WindowsTilePreview.tsx`
- [ ] 2.2.5 - Create `app/components/previews/BookmarkBarPreview.tsx`
- [ ] 2.2.6 - Create `app/components/previews/PWASplashPreview.tsx`
- [ ] 2.2.7 - Create `app/components/previews/PreviewGrid.tsx` to compose all previews

**Files to modify/create:**
- `app/components/previews/*.tsx` - Device frame preview components

---

##### Task 2.3: Create Upload Page Route

**Objective:** Build the /upload page with image uploader and navigation.
**Baby Step Checkpoint:** ✅ Tests | ✅ Lint | ✅ Types

**Subtasks:**
- [ ] 2.3.1 - Create `app/routes/upload.tsx` route module
- [ ] 2.3.2 - Compose ImageUploader component
- [ ] 2.3.3 - Add subtle login prompt (non-blocking)
- [ ] 2.3.4 - Navigate to /preview on successful upload
- [ ] 2.3.5 - Register route in `app/routes.ts`

**Files to modify/create:**
- `app/routes/upload.tsx` - Upload page route
- `app/routes.ts` - Add route registration

---

##### Task 2.4: Create Preview Page Route

**Objective:** Build the /preview page with device frame mockups.
**Baby Step Checkpoint:** ✅ Tests | ✅ Lint | ✅ Types

**Subtasks:**
- [ ] 2.4.1 - Create `app/routes/preview.tsx` route module
- [ ] 2.4.2 - Load image from sessionStorage, redirect to /upload if missing
- [ ] 2.4.3 - Compose PreviewGrid with all device mockups
- [ ] 2.4.4 - Add "Upload Different Image" button
- [ ] 2.4.5 - Add "Continue to Download" CTA button
- [ ] 2.4.6 - Register route in `app/routes.ts`

**Files to modify/create:**
- `app/routes/preview.tsx` - Preview page route
- `app/routes.ts` - Add route registration

---

### Phase 3: Download & Premium Upsell

**Goal:** Build the download interface with free/premium tier differentiation.
**Prerequisite:** Phase 2

#### Tasks

##### Task 3.1: Create Premium Status Service

**Objective:** Service to check and manage user premium status.
**Baby Step Checkpoint:** ✅ Tests | ✅ Lint | ✅ Types

**Subtasks:**
- [ ] 3.1.1 - Create `app/services/premium.server.ts`
- [ ] 3.1.2 - Implement `getUserPremiumStatus(userId)` - fetch from DB
- [ ] 3.1.3 - Implement `upgradeToPremium(userId, stripeCustomerId)` - update DB
- [ ] 3.1.4 - Add proper error handling

**Files to modify/create:**
- `app/services/premium.server.ts` - Premium status service

---

##### Task 3.2: Create Premium Context

**Objective:** React context to share premium status across components.
**Baby Step Checkpoint:** ✅ Tests | ✅ Lint | ✅ Types

**Subtasks:**
- [ ] 3.2.1 - Create `app/components/PremiumContext.tsx`
- [ ] 3.2.2 - Provide `isPremium` boolean and `isLoading` state
- [ ] 3.2.3 - Fetch premium status on auth state change
- [ ] 3.2.4 - Cache status in context to avoid repeated DB calls

**Files to modify/create:**
- `app/components/PremiumContext.tsx` - Premium status context

---

##### Task 3.3: Create Download Package Component

**Objective:** Component showing package contents with free/premium differentiation.
**Baby Step Checkpoint:** ✅ Tests | ✅ Lint | ✅ Types

**Subtasks:**
- [ ] 3.3.1 - Create `app/components/DownloadPackage.tsx`
- [ ] 3.3.2 - Two-column layout: Free (left) vs Premium (right)
- [ ] 3.3.3 - Show file tree for each package
- [ ] 3.3.4 - Lock indicator on premium files for non-premium users
- [ ] 3.3.5 - Download button for each tier

**Files to modify/create:**
- `app/components/DownloadPackage.tsx` - Download package display component

---

##### Task 3.4: Create Manifest Customization Form

**Objective:** Form for premium users to customize manifest.json settings.
**Baby Step Checkpoint:** ✅ Tests | ✅ Lint | ✅ Types

**Subtasks:**
- [ ] 3.4.1 - Create `app/components/ManifestForm.tsx`
- [ ] 3.4.2 - Add fields: App Name, Short Name, Theme Color, Background Color
- [ ] 3.4.3 - Color picker for theme/background colors
- [ ] 3.4.4 - Live preview of manifest.json output
- [ ] 3.4.5 - Zod validation for all fields

**Files to modify/create:**
- `app/components/ManifestForm.tsx` - Manifest customization form

---

##### Task 3.5: Create Download Page Route

**Objective:** Build the /download page with free/premium download options.
**Baby Step Checkpoint:** ✅ Tests | ✅ Lint | ✅ Types

**Subtasks:**
- [ ] 3.5.1 - Create `app/routes/download.tsx` route module
- [ ] 3.5.2 - Load image from sessionStorage, redirect to /upload if missing
- [ ] 3.5.3 - Compose DownloadPackage component
- [ ] 3.5.4 - Show ManifestForm for premium users only
- [ ] 3.5.5 - Premium upsell section for non-premium users
- [ ] 3.5.6 - Trigger ZIP generation and download on button click
- [ ] 3.5.7 - Register route in `app/routes.ts`

**Files to modify/create:**
- `app/routes/download.tsx` - Download page route
- `app/routes.ts` - Add route registration

---

### Phase 4: Payment Integration (Stripe)

**Goal:** Implement Stripe Checkout for premium purchases with webhook handling.
**Prerequisite:** Phase 3

#### Tasks

##### Task 4.1: Create Stripe Service

**Objective:** Server-side Stripe service for checkout session creation.
**Baby Step Checkpoint:** ✅ Tests | ✅ Lint | ✅ Types

**Subtasks:**
- [ ] 4.1.1 - Create `app/services/stripe.server.ts`
- [ ] 4.1.2 - Implement `createCheckoutSession(userId, userEmail)` - returns Stripe session URL
- [ ] 4.1.3 - Configure €5 one-time payment product
- [ ] 4.1.4 - Set success/cancel URLs
- [ ] 4.1.5 - Store customer ID in session metadata

**Files to modify/create:**
- `app/services/stripe.server.ts` - Stripe service

---

##### Task 4.2: Create Checkout API Route

**Objective:** API endpoint to create Stripe checkout session.
**Baby Step Checkpoint:** ✅ Tests | ✅ Lint | ✅ Types

**Subtasks:**
- [ ] 4.2.1 - Create `app/routes/api.stripe.checkout.tsx` route
- [ ] 4.2.2 - Require authentication (user must be logged in)
- [ ] 4.2.3 - Call Stripe service to create session
- [ ] 4.2.4 - Redirect to Stripe Checkout URL
- [ ] 4.2.5 - Register route in `app/routes.ts`

**Files to modify/create:**
- `app/routes/api.stripe.checkout.tsx` - Checkout API route
- `app/routes.ts` - Add route registration

---

##### Task 4.3: Create Stripe Webhook Handler

**Objective:** Webhook endpoint to handle Stripe payment success events.
**Baby Step Checkpoint:** ✅ Tests | ✅ Lint | ✅ Types

**Subtasks:**
- [ ] 4.3.1 - Create `app/routes/api.stripe.webhook.tsx` route
- [ ] 4.3.2 - Verify Stripe webhook signature
- [ ] 4.3.3 - Handle `checkout.session.completed` event
- [ ] 4.3.4 - Extract user ID from session metadata
- [ ] 4.3.5 - Call premium service to upgrade user
- [ ] 4.3.6 - Handle idempotency (duplicate webhooks)
- [ ] 4.3.7 - Register route in `app/routes.ts`

**Files to modify/create:**
- `app/routes/api.stripe.webhook.tsx` - Webhook handler route
- `app/routes.ts` - Add route registration

---

##### Task 4.4: Create Success Page Route

**Objective:** Build the /success page shown after successful payment.
**Baby Step Checkpoint:** ✅ Tests | ✅ Lint | ✅ Types

**Subtasks:**
- [ ] 4.4.1 - Create `app/routes/success.tsx` route module
- [ ] 4.4.2 - Show "Welcome to Premium!" confirmation message
- [ ] 4.4.3 - Explain lifetime access benefit
- [ ] 4.4.4 - CTA to return to download page
- [ ] 4.4.5 - Register route in `app/routes.ts`

**Files to modify/create:**
- `app/routes/success.tsx` - Success page route
- `app/routes.ts` - Add route registration

---

##### Task 4.5: Create Buy Premium Button Component

**Objective:** Button component that initiates Stripe checkout flow.
**Baby Step Checkpoint:** ✅ Tests | ✅ Lint | ✅ Types

**Subtasks:**
- [ ] 4.5.1 - Create `app/components/BuyPremiumButton.tsx`
- [ ] 4.5.2 - If not logged in: show "Sign in to buy" variant
- [ ] 4.5.3 - If logged in, not premium: show "Buy Premium - €5" variant
- [ ] 4.5.4 - If premium: show disabled "Already Premium" state
- [ ] 4.5.5 - Handle loading state during checkout redirect

**Files to modify/create:**
- `app/components/BuyPremiumButton.tsx` - Buy premium button component

---

### Phase 5: Landing Page & Legal Pages

**Goal:** Build the marketing landing page and required legal pages.
**Prerequisite:** Phase 2 (uses upload CTA)

#### Tasks

##### Task 5.1: Create Landing Page Hero Section

**Objective:** Build compelling hero section with clear value proposition.
**Baby Step Checkpoint:** ✅ Tests | ✅ Lint | ✅ Types

**Subtasks:**
- [ ] 5.1.1 - Create `app/components/landing/FaviconHero.tsx`
- [ ] 5.1.2 - Clear headline: "All your favicon formats in 10 seconds"
- [ ] 5.1.3 - Subheadline explaining the problem solved
- [ ] 5.1.4 - Primary CTA: "Upload your image"
- [ ] 5.1.5 - Trust signals: "No account needed for free tier"

**Files to modify/create:**
- `app/components/landing/FaviconHero.tsx` - Hero section component

---

##### Task 5.2: Create Features Section

**Objective:** Section explaining what's included in free vs premium.
**Baby Step Checkpoint:** ✅ Tests | ✅ Lint | ✅ Types

**Subtasks:**
- [ ] 5.2.1 - Create `app/components/landing/FeaturesSection.tsx`
- [ ] 5.2.2 - List free formats with checkmarks
- [ ] 5.2.3 - List premium formats with lock/unlock indicators
- [ ] 5.2.4 - Visual comparison between tiers

**Files to modify/create:**
- `app/components/landing/FeaturesSection.tsx` - Features section component

---

##### Task 5.3: Create How It Works Section

**Objective:** Three-step visual guide to using the tool.
**Baby Step Checkpoint:** ✅ Tests | ✅ Lint | ✅ Types

**Subtasks:**
- [ ] 5.3.1 - Create `app/components/landing/HowItWorks.tsx`
- [ ] 5.3.2 - Step 1: Upload your logo
- [ ] 5.3.3 - Step 2: Preview in all contexts
- [ ] 5.3.4 - Step 3: Download your package

**Files to modify/create:**
- `app/components/landing/HowItWorks.tsx` - How it works section component

---

##### Task 5.4: Update Landing Page Route

**Objective:** Compose landing page with new sections.
**Baby Step Checkpoint:** ✅ Tests | ✅ Lint | ✅ Types

**Subtasks:**
- [ ] 5.4.1 - Update `app/routes/home.tsx` with FaviconForge content
- [ ] 5.4.2 - Compose FaviconHero, FeaturesSection, HowItWorks
- [ ] 5.4.3 - Update Footer with FaviconForge branding
- [ ] 5.4.4 - Add SEO meta tags (title, description, OG tags)

**Files to modify/create:**
- `app/routes/home.tsx` - Update landing page route

---

##### Task 5.5: Create Terms of Service Page

**Objective:** Build /terms page with terms of service content.
**Baby Step Checkpoint:** ✅ Tests | ✅ Lint | ✅ Types

**Subtasks:**
- [ ] 5.5.1 - Create `app/routes/terms.tsx` route module
- [ ] 5.5.2 - Add terms of service content (template)
- [ ] 5.5.3 - Include sections: usage, payments, refunds, liability
- [ ] 5.5.4 - Register route in `app/routes.ts`

**Files to modify/create:**
- `app/routes/terms.tsx` - Terms of service page route
- `app/routes.ts` - Add route registration

---

##### Task 5.6: Create Privacy Policy Page

**Objective:** Build /privacy page with privacy policy content.
**Baby Step Checkpoint:** ✅ Tests | ✅ Lint | ✅ Types

**Subtasks:**
- [ ] 5.6.1 - Create `app/routes/privacy.tsx` route module
- [ ] 5.6.2 - Add privacy policy content (template)
- [ ] 5.6.3 - Include sections: data collected, cookies, third parties, GDPR
- [ ] 5.6.4 - Register route in `app/routes.ts`

**Files to modify/create:**
- `app/routes/privacy.tsx` - Privacy policy page route
- `app/routes.ts` - Add route registration

---

### Phase 6: Contact Form & Email

**Goal:** Implement contact form with Resend email integration.
**Prerequisite:** Phase 0 (dependencies)

#### Tasks

##### Task 6.1: Create Email Service

**Objective:** Service to send emails via Resend API.
**Baby Step Checkpoint:** ✅ Tests | ✅ Lint | ✅ Types

**Subtasks:**
- [ ] 6.1.1 - Create `app/services/email.server.ts`
- [ ] 6.1.2 - Implement `sendContactEmail(name, email, message)` function
- [ ] 6.1.3 - Configure Resend with API key from environment
- [ ] 6.1.4 - Handle errors gracefully

**Files to modify/create:**
- `app/services/email.server.ts` - Email service

---

##### Task 6.2: Create Contact Form Component

**Objective:** Contact form with name, email, and message fields.
**Baby Step Checkpoint:** ✅ Tests | ✅ Lint | ✅ Types

**Subtasks:**
- [ ] 6.2.1 - Create `app/components/ContactForm.tsx`
- [ ] 6.2.2 - Add fields: Name, Email, Message
- [ ] 6.2.3 - Zod validation for all fields
- [ ] 6.2.4 - Loading and success states
- [ ] 6.2.5 - Error handling with user-friendly messages

**Files to modify/create:**
- `app/components/ContactForm.tsx` - Contact form component

---

##### Task 6.3: Create Contact Page Route

**Objective:** Build /contact page with contact form.
**Baby Step Checkpoint:** ✅ Tests | ✅ Lint | ✅ Types

**Subtasks:**
- [ ] 6.3.1 - Create `app/routes/contact.tsx` route module
- [ ] 6.3.2 - Add action handler to process form submission
- [ ] 6.3.3 - Call email service on successful validation
- [ ] 6.3.4 - Show success message after email sent
- [ ] 6.3.5 - Register route in `app/routes.ts`

**Files to modify/create:**
- `app/routes/contact.tsx` - Contact page route
- `app/routes.ts` - Add route registration

---

##### Task 6.4: Create Contact API Route

**Objective:** API endpoint for contact form submission.
**Baby Step Checkpoint:** ✅ Tests | ✅ Lint | ✅ Types

**Subtasks:**
- [ ] 6.4.1 - Create `app/routes/api.contact.tsx` route
- [ ] 6.4.2 - Validate request body with Zod
- [ ] 6.4.3 - Call email service
- [ ] 6.4.4 - Return JSON response (success/error)
- [ ] 6.4.5 - Register route in `app/routes.ts`

**Files to modify/create:**
- `app/routes/api.contact.tsx` - Contact API route
- `app/routes.ts` - Add route registration

---

### Phase 7: Analytics & Cookie Consent

**Goal:** Implement GA4 tracking and GDPR-compliant cookie consent.
**Prerequisite:** Phase 5 (pages exist to track)

#### Tasks

##### Task 7.1: Create Analytics Service

**Objective:** Client-side service for GA4 event tracking.
**Baby Step Checkpoint:** ✅ Tests | ✅ Lint | ✅ Types

**Subtasks:**
- [ ] 7.1.1 - Create `app/services/analytics.client.ts`
- [ ] 7.1.2 - Initialize gtag with measurement ID from environment
- [ ] 7.1.3 - Implement `trackEvent(name, params)` function
- [ ] 7.1.4 - Implement all 13 events from PRD:
  - `page_view`
  - `file_upload_start`
  - `file_upload_success`
  - `file_upload_error`
  - `preview_view`
  - `download_free_click`
  - `download_free_complete`
  - `premium_interest`
  - `login_start`
  - `login_complete`
  - `checkout_start`
  - `checkout_complete`
  - `download_premium_complete`
  - `contact_form_submit`
- [ ] 7.1.5 - Only track if user has consented to cookies

**Files to modify/create:**
- `app/services/analytics.client.ts` - Analytics service

---

##### Task 7.2: Create Cookie Consent Banner

**Objective:** GDPR-compliant cookie consent banner.
**Baby Step Checkpoint:** ✅ Tests | ✅ Lint | ✅ Types

**Subtasks:**
- [ ] 7.2.1 - Create `app/components/CookieConsent.tsx`
- [ ] 7.2.2 - Show banner if consent not given
- [ ] 7.2.3 - "Accept" and "Decline" buttons
- [ ] 7.2.4 - Store consent in cookie (1 year expiry)
- [ ] 7.2.5 - Link to privacy policy

**Files to modify/create:**
- `app/components/CookieConsent.tsx` - Cookie consent banner component

---

##### Task 7.3: Integrate Analytics Throughout App

**Objective:** Add analytics tracking calls to all relevant user actions.
**Baby Step Checkpoint:** ✅ Tests | ✅ Lint | ✅ Types

**Subtasks:**
- [ ] 7.3.1 - Add GA4 script to `app/root.tsx`
- [ ] 7.3.2 - Track page views on route changes
- [ ] 7.3.3 - Add tracking to upload flow
- [ ] 7.3.4 - Add tracking to preview page
- [ ] 7.3.5 - Add tracking to download actions
- [ ] 7.3.6 - Add tracking to login/signup
- [ ] 7.3.7 - Add tracking to checkout flow
- [ ] 7.3.8 - Add tracking to contact form

**Files to modify/create:**
- `app/root.tsx` - Add GA4 script and page view tracking
- Various route/component files - Add event tracking

---

### Phase 8: Internationalization

**Goal:** Add all translation keys for FaviconForge UI.
**Prerequisite:** Phases 2-6 (UI exists)

#### Tasks

##### Task 8.1: Add Landing Page Translations

**Objective:** Translation keys for landing page content.
**Baby Step Checkpoint:** ✅ Tests | ✅ Lint | ✅ Types

**Subtasks:**
- [ ] 8.1.1 - Add hero section keys (title, subtitle, cta)
- [ ] 8.1.2 - Add features section keys
- [ ] 8.1.3 - Add how it works section keys
- [ ] 8.1.4 - Add footer keys

**Files to modify/create:**
- `app/locales/en.json` - English translations
- `app/locales/es.json` - Spanish translations

---

##### Task 8.2: Add Upload/Preview/Download Translations

**Objective:** Translation keys for core app flow.
**Baby Step Checkpoint:** ✅ Tests | ✅ Lint | ✅ Types

**Subtasks:**
- [ ] 8.2.1 - Add upload page keys (instructions, errors, validation messages)
- [ ] 8.2.2 - Add preview page keys
- [ ] 8.2.3 - Add download page keys
- [ ] 8.2.4 - Add premium upsell keys
- [ ] 8.2.5 - Add manifest form keys

**Files to modify/create:**
- `app/locales/en.json` - English translations
- `app/locales/es.json` - Spanish translations

---

##### Task 8.3: Add Legal & Error Translations

**Objective:** Translation keys for legal pages and error messages.
**Baby Step Checkpoint:** ✅ Tests | ✅ Lint | ✅ Types

**Subtasks:**
- [ ] 8.3.1 - Add terms page keys
- [ ] 8.3.2 - Add privacy page keys
- [ ] 8.3.3 - Add contact page keys
- [ ] 8.3.4 - Add all error message keys from PRD

**Files to modify/create:**
- `app/locales/en.json` - English translations
- `app/locales/es.json` - Spanish translations

---

### Phase 9: E2E Testing

**Goal:** Comprehensive E2E test coverage for all critical paths.
**Prerequisite:** Phases 1-7 (features complete)

#### Tasks

##### Task 9.1: Free Flow E2E Tests

**Objective:** Test complete free user flow (anonymous).
**Baby Step Checkpoint:** ✅ Tests | ✅ Lint | ✅ Types

**Subtasks:**
- [ ] 9.1.1 - Create `tests/e2e/favicon-free-flow.spec.ts`
- [ ] 9.1.2 - Test: Upload valid image → Preview renders → Download free ZIP
- [ ] 9.1.3 - Test: Verify free ZIP contents (web/ folder files)
- [ ] 9.1.4 - Add test fixtures for valid images (512x512 PNG)

**Files to modify/create:**
- `tests/e2e/favicon-free-flow.spec.ts` - Free flow tests
- `tests/fixtures/images/` - Test image fixtures

---

##### Task 9.2: Validation Error E2E Tests

**Objective:** Test all image validation error scenarios.
**Baby Step Checkpoint:** ✅ Tests | ✅ Lint | ✅ Types

**Subtasks:**
- [ ] 9.2.1 - Create `tests/e2e/favicon-validation.spec.ts`
- [ ] 9.2.2 - Test: Upload too small image → Error displayed
- [ ] 9.2.3 - Test: Upload non-square image → Error displayed
- [ ] 9.2.4 - Test: Upload invalid format → Error displayed
- [ ] 9.2.5 - Test: Upload oversized file → Error displayed
- [ ] 9.2.6 - Add test fixtures for invalid images

**Files to modify/create:**
- `tests/e2e/favicon-validation.spec.ts` - Validation tests
- `tests/fixtures/images/` - Invalid test image fixtures

---

##### Task 9.3: Premium Purchase Flow E2E Tests

**Objective:** Test premium purchase flow with mocked Stripe.
**Baby Step Checkpoint:** ✅ Tests | ✅ Lint | ✅ Types

**Subtasks:**
- [ ] 9.3.1 - Create `tests/e2e/favicon-premium-flow.spec.ts`
- [ ] 9.3.2 - Test: Login → Upload → Click "Buy Premium" → Mock Stripe success webhook → Verify DB updated
- [ ] 9.3.3 - Test: Premium user can download premium ZIP
- [ ] 9.3.4 - Test: Premium status persists across sessions
- [ ] 9.3.5 - Create mock Stripe webhook helper

**Files to modify/create:**
- `tests/e2e/favicon-premium-flow.spec.ts` - Premium flow tests
- `tests/helpers/stripe-mock.ts` - Stripe mock helpers

---

##### Task 9.4: Edge Case E2E Tests

**Objective:** Test edge cases and error recovery.
**Baby Step Checkpoint:** ✅ Tests | ✅ Lint | ✅ Types

**Subtasks:**
- [ ] 9.4.1 - Create `tests/e2e/favicon-edge-cases.spec.ts`
- [ ] 9.4.2 - Test: Refresh on preview page → State preserved from sessionStorage
- [ ] 9.4.3 - Test: Direct navigation to /preview without upload → Redirect to /upload
- [ ] 9.4.4 - Test: Direct navigation to /download without upload → Redirect to /upload
- [ ] 9.4.5 - Test: Try premium download without login → Login prompt shown

**Files to modify/create:**
- `tests/e2e/favicon-edge-cases.spec.ts` - Edge case tests

---

### Phase 10: Polish & Accessibility

**Goal:** Final polish, responsive design, and accessibility compliance.
**Prerequisite:** Phases 1-8 (features complete)

#### Tasks

##### Task 10.1: Responsive Design Review

**Objective:** Ensure all pages work on mobile, tablet, and desktop.
**Baby Step Checkpoint:** ✅ Tests | ✅ Lint | ✅ Types

**Subtasks:**
- [ ] 10.1.1 - Test and fix landing page responsiveness
- [ ] 10.1.2 - Test and fix upload page responsiveness
- [ ] 10.1.3 - Test and fix preview page (swipeable previews on mobile)
- [ ] 10.1.4 - Test and fix download page two-column layout
- [ ] 10.1.5 - Fix any horizontal scroll issues (see KNOWN_ISSUES.md)

**Files to modify/create:**
- Various component files - Responsive fixes

---

##### Task 10.2: Accessibility Audit

**Objective:** WCAG 2.1 AA compliance for all pages.
**Baby Step Checkpoint:** ✅ Tests | ✅ Lint | ✅ Types

**Subtasks:**
- [ ] 10.2.1 - Add ARIA labels to all interactive elements
- [ ] 10.2.2 - Ensure keyboard navigation works for all flows
- [ ] 10.2.3 - Verify color contrast meets WCAG AA
- [ ] 10.2.4 - Add skip links for main content
- [ ] 10.2.5 - Test with screen reader

**Files to modify/create:**
- Various component files - Accessibility fixes

---

##### Task 10.3: SEO Optimization

**Objective:** Optimize pages for search engines.
**Baby Step Checkpoint:** ✅ Tests | ✅ Lint | ✅ Types

**Subtasks:**
- [ ] 10.3.1 - Add meta tags to all pages (title, description, robots)
- [ ] 10.3.2 - Add Open Graph tags for social sharing
- [ ] 10.3.3 - Add structured data (JSON-LD) for SoftwareApplication
- [ ] 10.3.4 - Create sitemap.xml
- [ ] 10.3.5 - Create robots.txt

**Files to modify/create:**
- Various route files - Meta tags
- `public/sitemap.xml` - Sitemap
- `public/robots.txt` - Robots file

---

##### Task 10.4: Update Header for FaviconForge

**Objective:** Update header component with FaviconForge branding and navigation.
**Baby Step Checkpoint:** ✅ Tests | ✅ Lint | ✅ Types

**Subtasks:**
- [ ] 10.4.1 - Update logo/brand name to "FaviconForge"
- [ ] 10.4.2 - Add premium badge next to avatar for premium users
- [ ] 10.4.3 - Ensure navigation links are correct

**Files to modify/create:**
- `app/components/Header.tsx` - Update header

---

## Implementation Order

Sequential list of all tasks in recommended order:

1. Task 0.1 - Extend User Schema for Premium
2. Task 0.2 - Install Required Dependencies
3. Task 0.3 - Add Environment Variables Documentation
4. Task 1.1 - Create Image Validation Service
5. Task 1.2 - Create Canvas Resizing Service
6. Task 1.3 - Create ICO Generation Service
7. Task 1.4 - Create Manifest Generator Service
8. Task 1.5 - Create ZIP Packaging Service
9. Task 1.6 - Create Favicon Generation Orchestrator Hook
10. Task 2.1 - Create Image Upload Component
11. Task 2.2 - Create Device Frame Preview Components
12. Task 2.3 - Create Upload Page Route
13. Task 2.4 - Create Preview Page Route
14. Task 3.1 - Create Premium Status Service
15. Task 3.2 - Create Premium Context
16. Task 3.3 - Create Download Package Component
17. Task 3.4 - Create Manifest Customization Form
18. Task 3.5 - Create Download Page Route
19. Task 4.1 - Create Stripe Service
20. Task 4.2 - Create Checkout API Route
21. Task 4.3 - Create Stripe Webhook Handler
22. Task 4.4 - Create Success Page Route
23. Task 4.5 - Create Buy Premium Button Component
24. Task 5.1 - Create Landing Page Hero Section
25. Task 5.2 - Create Features Section
26. Task 5.3 - Create How It Works Section
27. Task 5.4 - Update Landing Page Route
28. Task 5.5 - Create Terms of Service Page
29. Task 5.6 - Create Privacy Policy Page
30. Task 6.1 - Create Email Service
31. Task 6.2 - Create Contact Form Component
32. Task 6.3 - Create Contact Page Route
33. Task 6.4 - Create Contact API Route
34. Task 7.1 - Create Analytics Service
35. Task 7.2 - Create Cookie Consent Banner
36. Task 7.3 - Integrate Analytics Throughout App
37. Task 8.1 - Add Landing Page Translations
38. Task 8.2 - Add Upload/Preview/Download Translations
39. Task 8.3 - Add Legal & Error Translations
40. Task 9.1 - Free Flow E2E Tests
41. Task 9.2 - Validation Error E2E Tests
42. Task 9.3 - Premium Purchase Flow E2E Tests
43. Task 9.4 - Edge Case E2E Tests
44. Task 10.1 - Responsive Design Review
45. Task 10.2 - Accessibility Audit
46. Task 10.3 - SEO Optimization
47. Task 10.4 - Update Header for FaviconForge

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| png-to-ico library compatibility issues | Medium | Test early in Phase 1; have fallback to generate individual PNGs only |
| Large images crash browser during processing | High | Enforce 10MB limit strictly; show processing indicator; use web workers if needed |
| Stripe webhook reliability | Medium | Implement idempotency; add retry logic; manual premium upgrade fallback |
| sessionStorage limits for large images | Medium | Compress base64 data; consider IndexedDB as fallback |
| Browser Canvas API differences | Low | Test on Chrome, Safari, Firefox; use feature detection |
| OAuth limitations for testing | Low | Document manual testing required; mock where possible |

---

## Open Questions

- [ ] Final domain name for FaviconForge
- [ ] Hosting provider decision (Vercel/Railway/other)
- [ ] GA4 property ID (to be created during implementation)
- [ ] Legal content review (Terms of Service, Privacy Policy templates need legal review)
- [ ] Refund policy for edge cases (manual handling acceptable at €5 price point)

---

## Progress Tracker

| Phase | Task | Status | Notes |
|-------|------|--------|-------|
| 0 | 0.1 | ⬜ Not Started | |
| 0 | 0.2 | ⬜ Not Started | |
| 0 | 0.3 | ⬜ Not Started | |
| 1 | 1.1 | ⬜ Not Started | |
| 1 | 1.2 | ⬜ Not Started | |
| 1 | 1.3 | ⬜ Not Started | |
| 1 | 1.4 | ⬜ Not Started | |
| 1 | 1.5 | ⬜ Not Started | |
| 1 | 1.6 | ⬜ Not Started | |
| 2 | 2.1 | ⬜ Not Started | |
| 2 | 2.2 | ⬜ Not Started | |
| 2 | 2.3 | ⬜ Not Started | |
| 2 | 2.4 | ⬜ Not Started | |
| 3 | 3.1 | ⬜ Not Started | |
| 3 | 3.2 | ⬜ Not Started | |
| 3 | 3.3 | ⬜ Not Started | |
| 3 | 3.4 | ⬜ Not Started | |
| 3 | 3.5 | ⬜ Not Started | |
| 4 | 4.1 | ⬜ Not Started | |
| 4 | 4.2 | ⬜ Not Started | |
| 4 | 4.3 | ⬜ Not Started | |
| 4 | 4.4 | ⬜ Not Started | |
| 4 | 4.5 | ⬜ Not Started | |
| 5 | 5.1 | ⬜ Not Started | |
| 5 | 5.2 | ⬜ Not Started | |
| 5 | 5.3 | ⬜ Not Started | |
| 5 | 5.4 | ⬜ Not Started | |
| 5 | 5.5 | ⬜ Not Started | |
| 5 | 5.6 | ⬜ Not Started | |
| 6 | 6.1 | ⬜ Not Started | |
| 6 | 6.2 | ⬜ Not Started | |
| 6 | 6.3 | ⬜ Not Started | |
| 6 | 6.4 | ⬜ Not Started | |
| 7 | 7.1 | ⬜ Not Started | |
| 7 | 7.2 | ⬜ Not Started | |
| 7 | 7.3 | ⬜ Not Started | |
| 8 | 8.1 | ⬜ Not Started | |
| 8 | 8.2 | ⬜ Not Started | |
| 8 | 8.3 | ⬜ Not Started | |
| 9 | 9.1 | ⬜ Not Started | |
| 9 | 9.2 | ⬜ Not Started | |
| 9 | 9.3 | ⬜ Not Started | |
| 9 | 9.4 | ⬜ Not Started | |
| 10 | 10.1 | ⬜ Not Started | |
| 10 | 10.2 | ⬜ Not Started | |
| 10 | 10.3 | ⬜ Not Started | |
| 10 | 10.4 | ⬜ Not Started | |

**Status Legend:** ⬜ Not Started | 🔄 In Progress | ✅ Complete | ⏸️ Blocked
