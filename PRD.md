# PRD: FaviconForge

## Executive Summary

FaviconForge is a web application that generates all required favicon formats from a single uploaded image. The tool solves the tedious problem of creating 15+ different favicon files manually, delivering a complete ZIP package with all formats and ready-to-use HTML code in under 10 seconds.

**Business Model:** Freemium with lifetime premium access
- **Free:** Basic favicon formats (ICO, PNG 16/32/48)
- **Premium (€5 one-time):** All formats including PWA, Apple, Windows + manifest customization

**Target Audience:** Web developers, designers, and anyone launching a website or PWA.

---

## Problem Statement

Modern web applications require multiple favicon formats to ensure proper display across all platforms and devices:

- **ICO** format for legacy browser support
- **Multiple PNG sizes** (16x16, 32x32, 48x48, etc.)
- **Apple Touch Icons** (180x180) for iOS home screens
- **Maskable icons** for PWA installations
- **manifest.json** for PWA configuration
- **browserconfig.xml** for Windows tiles
- **Safari pinned tab** icons

Creating these manually takes 30+ minutes, requires knowledge of each format's requirements, and is error-prone. Existing solutions are either outdated, cluttered with ads, or overly complex.

---

## Goals and Success Metrics

### Goals

1. Provide the fastest favicon generation experience (< 10 seconds)
2. Generate production-ready, standards-compliant favicon packages
3. Achieve sustainable revenue through lifetime premium purchases
4. Build SEO authority in the favicon/web development tools space

### Success Metrics

| Metric | Target (3 months) |
|--------|-------------------|
| Monthly unique visitors | 10,000 |
| Free ZIP downloads | 5,000/month |
| Premium conversions | 2% of free users |
| Average session duration | > 2 minutes |
| Bounce rate | < 40% |

---

## User Stories and Requirements

### User Stories

#### Free User Flow (Anonymous)
1. **US-001:** As a developer, I want to upload my logo image so that I can generate favicons without creating an account
2. **US-002:** As a developer, I want to preview how my favicon will look in different contexts so that I can verify quality before downloading
3. **US-003:** As a developer, I want to download a ZIP with basic favicon formats so that I can quickly add favicons to my website

#### Premium User Flow (Authenticated)
4. **US-004:** As a developer, I want to sign in with Google so that I can purchase premium access
5. **US-005:** As a signed-in user, I want to pay €5 once to unlock premium formats forever
6. **US-006:** As a premium user, I want to customize my manifest.json (app name, colors) so that my PWA is properly branded
7. **US-007:** As a premium user on a new device, I want to sign in and automatically have my premium status restored
8. **US-008:** As a premium user, I want comprehensive documentation in my ZIP so that I know exactly how to implement each file

### Functional Requirements

#### Image Upload (FR-001)
- Accept PNG, JPEG, and WebP formats
- Minimum size: 512x512 pixels
- Maximum size: 10MB
- Only square images accepted (reject non-square with clear error message)
- Client-side processing using Canvas API
- No account required for upload

#### Favicon Generation (FR-002)

**Basic (Free) Formats:**
- `favicon.ico` (multi-resolution: 16x16, 32x32, 48x48)
- `favicon-16x16.png`
- `favicon-32x32.png`
- `favicon-48x48.png`

**Premium Formats (requires account + payment):**
- `apple-touch-icon.png` (180x180)
- `icon-192.png` (Android/PWA)
- `icon-512.png` (Android/PWA)
- `maskable-icon-192.png`
- `maskable-icon-512.png`
- `safari-pinned-tab.svg` (if applicable)
- `mstile-150x150.png` (Windows)
- `manifest.json` (customizable)
- `browserconfig.xml`

#### Authentication (FR-003)
- **Provider:** Google OAuth only
- **When required:** Only for purchasing premium
- **Anonymous usage:** Free tier works without any account
- **Session persistence:** Stay logged in across browser sessions
- **Multi-device:** Login on new device restores premium status automatically

#### Preview System (FR-004)
- Dynamic HTML/CSS mockups (not static images)
- Browser tab preview (Chrome, Safari)
- iOS home screen preview
- Android home screen preview
- Windows Start menu tile preview
- Bookmark bar preview
- PWA splash screen preview

#### ZIP Output Structure (FR-005)
```
faviconforge-output/
├── web/
│   ├── favicon.ico
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   └── favicon-48x48.png
├── ios/                          [PREMIUM]
│   └── apple-touch-icon.png
├── android/                      [PREMIUM]
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── maskable-icon-192.png
│   └── maskable-icon-512.png
├── windows/                      [PREMIUM]
│   ├── mstile-150x150.png
│   └── browserconfig.xml
├── pwa/                          [PREMIUM]
│   └── manifest.json
├── snippet.html                  (with inline comments)
└── README.md                     [PREMIUM]
```

#### Payment Flow (FR-006)
- **Prerequisite:** User must be logged in with Google before paying
- **Processor:** Stripe Checkout
- **Price:** €5 one-time payment
- **Flow:** Login → Click "Buy Premium" → Stripe Checkout → Return to app → Premium unlocked forever
- **Persistence:** Premium status stored in database, linked to Google account
- **Restoration:** Any device, any time - login with same Google account = premium restored

### Non-Functional Requirements

- **NFR-001:** All image processing must happen client-side (Canvas API + JSZip + png-to-ico library)
- **NFR-002:** Image data is ephemeral (not persisted to server)
- **NFR-003:** User account data persisted in PostgreSQL (minimal: user + premium status)
- **NFR-004:** Support dark mode with toggle
- **NFR-005:** Available in Spanish and English (i18n)
- **NFR-006:** SEO-optimized pages (meta tags, structured data, semantic HTML)
- **NFR-007:** WCAG 2.1 AA accessibility compliance

---

## Technical Architecture

### Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | React Router 7 + React 19 |
| Build | Vite |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Language | TypeScript |
| Database | PostgreSQL + Drizzle ORM |
| Authentication | Better Auth + Google OAuth |
| Image Processing | Canvas API (browser native) |
| ICO Generation | png-to-ico (JS library, ~50KB) |
| ZIP Generation | JSZip |
| Payments | Stripe Checkout |
| Email | Resend (contact form) |
| Analytics | Google Analytics 4 |
| Testing | Playwright + TestContainers |
| Hosting | TBD (Vercel/Railway compatible) |

### Application Routes

```
/                    → Landing page with value proposition
/upload              → Image upload interface
/preview             → Favicon previews in all contexts
/download            → Download interface (free/premium selection)
/success             → Post-payment success page
/auth/login          → Google OAuth login
/auth/callback       → OAuth callback handler
/terms               → Terms of Service
/privacy             → Privacy Policy
/contact             → Contact form
```

### Database Schema (Minimal)

```sql
-- Users table (managed by Better Auth)
users (
  id              UUID PRIMARY KEY,
  email           VARCHAR NOT NULL UNIQUE,
  name            VARCHAR,
  image           VARCHAR,
  is_premium      BOOLEAN DEFAULT FALSE,
  premium_since   TIMESTAMP,
  stripe_customer_id VARCHAR,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP
)

-- Sessions table (managed by Better Auth)
sessions (
  id              UUID PRIMARY KEY,
  user_id         UUID REFERENCES users(id),
  token           VARCHAR NOT NULL,
  expires_at      TIMESTAMP NOT NULL,
  created_at      TIMESTAMP DEFAULT NOW()
)

-- Accounts table (managed by Better Auth, for OAuth)
accounts (
  id              UUID PRIMARY KEY,
  user_id         UUID REFERENCES users(id),
  provider        VARCHAR NOT NULL,  -- 'google'
  provider_account_id VARCHAR NOT NULL,
  ...
)
```

### State Management

- **Session state:** `sessionStorage` for uploaded image (base64)
- **URL state:** Metadata and navigation state in URL parameters
- **Auth state:** Better Auth handles session cookies
- **Premium state:** Fetched from database on login, cached in React context

### Client-Side Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐    ┌──────────┐    ┌─────────┐    ┌─────────┐ │
│  │ Upload  │───▶│ Canvas   │───▶│ JSZip   │───▶│Download │ │
│  │ Handler │    │ Resize   │    │ Package │    │ Trigger │ │
│  └─────────┘    └──────────┘    └─────────┘    └─────────┘ │
│       │              │               │                      │
│       ▼              ▼               ▼                      │
│  ┌─────────┐    ┌──────────┐    ┌─────────┐               │
│  │Validate │    │png-to-ico│    │ Premium │               │
│  │ Image   │    │ Convert  │    │ Check   │◄── Auth Context│
│  └─────────┘    └──────────┘    └─────────┘               │
├─────────────────────────────────────────────────────────────┤
│                    sessionStorage                            │
│                    (image base64)                            │
└─────────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  User   │────▶│  App    │────▶│ Google  │────▶│  App    │
│ clicks  │     │redirect │     │  OAuth  │     │callback │
│ login   │     │to Google│     │ consent │     │         │
└─────────┘     └─────────┘     └─────────┘     └────┬────┘
                                                      │
                                                      ▼
                                               ┌─────────────┐
                                               │ Better Auth │
                                               │ creates     │
                                               │ session +   │
                                               │ user record │
                                               └─────────────┘
```

### Payment Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  User   │────▶│ Verify  │────▶│ Stripe  │────▶│ Webhook │
│ clicks  │     │ logged  │     │Checkout │     │ updates │
│ "Buy"   │     │   in    │     │  page   │     │   DB    │
└─────────┘     └─────────┘     └─────────┘     └────┬────┘
                                                      │
                                                      ▼
                                               ┌─────────────┐
                                               │ User marked │
                                               │ is_premium  │
                                               │  = true     │
                                               └─────────────┘
```

### Backend Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/auth/*` | * | - | Better Auth handlers |
| `/api/stripe/checkout` | POST | Required | Create Stripe checkout session |
| `/api/stripe/webhook` | POST | Stripe signature | Handle payment success, update DB |
| `/api/user/status` | GET | Required | Get current user's premium status |
| `/api/contact` | POST | - | Send contact form email via Resend |

---

## UI/UX Specifications

### Design Principles

1. **Speed-first:** Minimize clicks between upload and download
2. **Visual feedback:** Real-time preview as soon as image is uploaded
3. **Progressive disclosure:** Show premium features subtly, not aggressively
4. **Anonymous by default:** No login wall for basic functionality
5. **Developer-friendly:** Technical accuracy in documentation and naming

### Key Screens

#### 1. Landing Page (`/`)
- Hero with clear value proposition
- Single CTA: "Upload your image"
- Brief explanation of what's generated
- Trust signals (formats supported, no account needed for free tier)

#### 2. Upload Page (`/upload`)
- Drag-and-drop zone
- File picker fallback
- Clear requirements displayed (512x512 min, square, PNG/JPEG/WebP)
- Immediate error feedback for invalid images
- Optional login prompt (subtle, not blocking)

#### 3. Preview Page (`/preview`)
- Grid of dynamic mockups:
  - Browser tabs (Chrome, Safari, Firefox)
  - iOS home screen
  - Android home screen
  - Windows Start menu
  - Bookmark bar
  - PWA installed app
- "Regenerate" option to upload different image
- "Continue to Download" CTA

#### 4. Download Page (`/download`)
- Two-column layout:
  - Left: Free package contents
  - Right: Premium package contents (locked visual indicator)
- Free download button (always enabled)
- Premium section shows:
  - If not logged in: "Sign in with Google to buy premium (€5)"
  - If logged in, not premium: "Buy Premium - €5 (one time, forever)"
  - If premium: Download button enabled

#### 5. Success Page (`/success`)
- Confirmation message: "Welcome to Premium!"
- Explanation: "You now have lifetime access to all premium features"
- Automatic redirect to download page (or download trigger)

### Authentication UI

- **Login button:** "Sign in with Google" in header
- **Logged in state:** User avatar + dropdown with "Sign out"
- **Premium badge:** Small "PRO" badge next to avatar for premium users

### Error States

All errors must be user-friendly with actionable guidance:

| Error | Message |
|-------|---------|
| Image too small | "Your image is too small. Please upload an image at least 512x512 pixels for best quality." |
| Not square | "Favicons must be square. Please upload a square image or crop your image before uploading." |
| Invalid format | "We support PNG, JPEG, and WebP images. Please convert your image to one of these formats." |
| File too large | "Your file exceeds 10MB. Please compress or resize your image." |
| Processing error | "Something went wrong while processing your image. Please try again or contact support." |
| Auth error | "Couldn't sign in with Google. Please try again." |
| Payment error | "Payment couldn't be processed. Please try again or contact support." |

### Responsive Behavior

- Desktop: Full preview grid
- Tablet: 2-column preview grid
- Mobile: Single column, swipeable previews

---

## Analytics Events

### Google Analytics 4 Event Tracking

| Event Name | Trigger | Parameters |
|------------|---------|------------|
| `page_view` | Each route | `page_path`, `page_title` |
| `file_upload_start` | User selects file | `file_type`, `file_size` |
| `file_upload_success` | Image validated | `image_dimensions` |
| `file_upload_error` | Validation fails | `error_type` |
| `preview_view` | Preview page loads | `mockup_count` |
| `download_free_click` | Free download clicked | `is_authenticated` |
| `download_free_complete` | ZIP downloaded | `file_count` |
| `premium_interest` | Premium section viewed | `is_authenticated` |
| `login_start` | Login button clicked | `trigger_location` |
| `login_complete` | OAuth callback success | - |
| `checkout_start` | Stripe redirect initiated | - |
| `checkout_complete` | Return from Stripe success | - |
| `download_premium_complete` | Premium ZIP downloaded | `file_count` |
| `contact_form_submit` | Contact form sent | - |

---

## Security Considerations

### Authentication Security

1. **OAuth only:** No password storage, Google handles auth security
2. **Better Auth:** Proven library with secure session management
3. **CSRF protection:** Built into Better Auth
4. **Session expiry:** Configurable session duration

### Client-Side Security

1. **No sensitive data storage:** Images processed in memory, not persisted
2. **Content Security Policy:** Strict CSP headers to prevent XSS
3. **Input validation:** File type, size, and dimensions validated before processing

### Payment Security

1. **Stripe handles all payment data:** No card details touch our servers
2. **Webhook verification:** Validate Stripe webhook signatures
3. **Idempotent updates:** Handle duplicate webhook events gracefully
4. **Acknowledged risk:** Premium code is client-side; technical users can bypass. Accepted trade-off for €5 price point.

### Database Security

1. **Minimal data:** Only store what's necessary (user info + premium status)
2. **No image storage:** Images never reach the server
3. **Parameterized queries:** Drizzle ORM prevents SQL injection

### Privacy

1. **No tracking cookies:** GA4 in cookieless mode where possible
2. **Minimal data collection:** Only email/name from Google OAuth
3. **Ephemeral image processing:** Images never saved to server
4. **GDPR compliance:** Privacy policy, data deletion on request
5. **Cookie notice:** For authentication session cookies

---

## Testing Strategy

### E2E Test Coverage (Playwright)

#### Critical Paths
1. **Free flow complete (anonymous):**
   - Upload valid image → Preview renders → Download free ZIP → Verify ZIP contents

2. **Auth flow:**
   - Click login → Google OAuth (mocked) → Verify logged in state → Verify session persists

3. **Premium purchase flow (mocked Stripe):**
   - Login → Upload → Click "Buy Premium" → Mock Stripe success webhook → Verify DB updated → Download premium ZIP

4. **Premium restoration:**
   - Login as existing premium user → Verify premium status loaded → Verify can download premium

5. **Error handling:**
   - Upload too small image → Error displayed
   - Upload non-square image → Error displayed
   - Upload invalid format → Error displayed
   - Upload oversized file → Error displayed

6. **Edge cases:**
   - Refresh on preview page → State preserved from sessionStorage
   - Direct navigation to /preview without upload → Redirect to /upload
   - Try premium download without login → Login prompt shown
   - Network error during processing → Graceful error message

### Test Fixtures

- Valid square PNG (512x512)
- Valid square JPEG (1024x1024)
- Valid WebP (512x512)
- Too small image (256x256)
- Non-square image (800x600)
- Oversized file (15MB)
- Invalid format (GIF, BMP)
- Mock OAuth responses
- Mock Stripe webhook payloads

---

## Internationalization

### Supported Languages
- Spanish (es) - Default
- English (en)

### Translation Scope
- All UI text
- Error messages
- HTML snippet comments in ZIP
- README.md in ZIP (single language based on user's locale)
- Legal pages (Terms, Privacy)
- Email templates (contact form confirmation)

---

## Risks and Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Users bypass premium paywall | Low revenue | Medium | Accept risk; €5 not worth sophisticated protection. Honest users will pay. |
| Google OAuth downtime | Can't purchase | Low | Show clear error, suggest trying later |
| Browser compatibility issues with Canvas | Poor UX for some users | Low | Test on major browsers; provide clear browser requirements |
| Large images crash browser | Bad UX | Medium | 10MB limit; show processing indicator; catch errors gracefully |
| ICO library produces invalid files | Broken favicons | Low | Test extensively; fallback messaging |
| Stripe integration issues | No revenue | Low | Standard Stripe Checkout; well-documented |
| Database issues | Auth broken | Low | Use managed PostgreSQL; proper error handling |
| SEO competition | Low visibility | High | Focus on quality content; prepare for blog integration |

---

## Open Questions

1. **Domain:** Final domain name for FaviconForge (faviconforge.com availability?)
2. **Hosting:** Vercel vs Railway vs other provider
3. **GA4 Property:** Create new property during implementation
4. **Legal templates:** Source for Terms of Service and Privacy Policy
5. **UI Design:** To be defined with Opus in separate design phase
6. **Refund policy:** What if someone requests a refund? (Suggest: manual review, case by case)

---

## Implementation Notes

### Dependencies to Add
```json
{
  "png-to-ico": "^x.x.x",
  "jszip": "^x.x.x",
  "@stripe/stripe-js": "^x.x.x",
  "stripe": "^x.x.x",
  "resend": "^x.x.x"
}
```

### Environment Variables Required
```
# Database (existing in template)
DATABASE_URL=

# Auth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
BETTER_AUTH_SECRET=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Email
RESEND_API_KEY=

# Analytics
GA_MEASUREMENT_ID=
```

### Database Migrations

Add to existing Better Auth schema:
```sql
ALTER TABLE users ADD COLUMN is_premium BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN premium_since TIMESTAMP;
ALTER TABLE users ADD COLUMN stripe_customer_id VARCHAR;
```

### Key Implementation Decisions

1. **ICO generation:** Use `png-to-ico` library client-side (~50KB bundle impact)
2. **ZIP generation:** Use `JSZip` library client-side
3. **State persistence:** `sessionStorage` for image data, URL params for navigation state
4. **Auth:** Better Auth with Google OAuth provider (already in template)
5. **Premium validation:** Database lookup on login, cached in React context
6. **Payment:** Stripe Checkout with webhook for reliable status updates
7. **Contact form:** Resend API for email delivery

---

## Appendix: Favicon Formats Reference

| File | Size | Purpose | Tier |
|------|------|---------|------|
| favicon.ico | 16, 32, 48 | Legacy browsers, Windows | Free |
| favicon-16x16.png | 16x16 | Modern browsers | Free |
| favicon-32x32.png | 32x32 | Modern browsers, retina | Free |
| favicon-48x48.png | 48x48 | Windows taskbar | Free |
| apple-touch-icon.png | 180x180 | iOS home screen | Premium |
| icon-192.png | 192x192 | Android, PWA | Premium |
| icon-512.png | 512x512 | PWA splash, install | Premium |
| maskable-icon-*.png | 192, 512 | PWA adaptive icons | Premium |
| mstile-150x150.png | 150x150 | Windows tiles | Premium |
| manifest.json | - | PWA configuration | Premium |
| browserconfig.xml | - | Windows tile config | Premium |

---

*Document generated: 2025-12-30*
*Version: 1.0*
