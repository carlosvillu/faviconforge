# FEATURE_1.3_LandingPage.md

## 1. Natural Language Description

### Current State
The landing page (`app/routes/home.tsx`) is a generic SaaS template placeholder with:
- A minimal HeroSection that shows "[PROJECT_NAME]" and generic auth buttons
- A basic Footer component
- Template i18n keys like `hero_title: "Welcome to [PROJECT_NAME]"`

The design and content do not reflect FaviconForge's value proposition or brutalist aesthetic.

### Expected End State
After this task, the landing page will:
- Display the FaviconForge hero with headline "Generate ALL Favicon Formats"
- Show a single "Upload Image" CTA button linking to `/upload`
- Display a visual demo card showing format examples (free vs premium)
- Include a "Why FaviconForge?" features grid with 6 benefits
- Include a pricing section comparing Free (€0) and Premium (€5) tiers
- Display a complete footer with links to Terms, Privacy, and Contact
- All text internationalized in English and Spanish
- Follow the brutalist design system from `STYLE_GUIDE.md`
- Use the shared Header from `root.tsx` (already implemented)

### Acceptance Criteria
- [ ] Landing page matches the mockup in `mockups/LandingPage.jsx`
- [ ] All text uses i18n keys (no hardcoded strings except brand name)
- [ ] "Upload Image" CTA navigates to `/upload`
- [ ] Pricing section shows Free and Premium tiers correctly
- [ ] Footer has working links to `/terms`, `/privacy`, `/contact` (routes may not exist yet, links are placeholders)
- [ ] Page is responsive (mobile-first with `md:` and `lg:` breakpoints)
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes

---

## 2. Technical Description

### Approach
Replace the template landing components with FaviconForge-specific components that implement the mockup's brutalist design. The implementation will:

1. **Delete obsolete components**: Remove `EditorialDivider.tsx` (unused)
2. **Replace HeroSection**: New component with headline, tagline, and single CTA
3. **Create FormatDemoCard**: Visual demo showing favicon formats (free/premium)
4. **Create FeaturesSection**: 6-card grid with feature highlights
5. **Create PricingSection**: Two-column comparison (Free vs Premium)
6. **Update Footer**: Add links grid with Terms, Privacy, Contact
7. **Update home.tsx**: Compose all sections with proper background colors
8. **Add i18n keys**: ~40 new translation keys for both languages

### Architecture Decisions
- Components are pure UI without business logic
- All text comes from i18n
- Footer links point to routes that will be created in Phase 8
- No authentication check needed (landing always visible per user choice)
- **Footer as shared component:** Move Footer to `app/components/Footer.tsx` (same level as Header) and include it in `root.tsx` so it appears on all pages

---

## 2.1. Architecture Gate

- **Pages are puzzles:** `home.tsx` contains no UI logic, only composes: `HeroSection`, `FeaturesSection`, `PricingSection` (Footer is in root.tsx)
- **Loaders/actions are thin:** The loader only fetches user session (already implemented), no changes needed
- **Business logic is not in components:** These are purely presentational components with no domain logic
  - `HeroSection` - renders headline + CTA
  - `FormatDemoCard` - renders static format list
  - `FeaturesSection` - renders feature grid
  - `PricingSection` - renders pricing cards
  - `Footer` - renders footer links (shared component in `app/components/`, used in `root.tsx`)

---

## 3. Files to Change/Create

### `app/components/landing/HeroSection.tsx`
**Objective:** Display the main hero section with headline, tagline, and "Upload Image" CTA

**Pseudocode:**
```pseudocode
COMPONENT HeroSection
  USE t from useTranslation

  RENDER section with yellow background (bg-yellow-300)
    CONTAINER max-w-7xl, centered, px-6, py-20
      GRID 2 columns (lg:grid-cols-2)
        LEFT COLUMN (space-y-8)
          H2 headline (text-7xl, font-black, uppercase)
            Line 1: t('landing_hero_line1') // "Generate"
            Line 2: SPAN with bg-black text-yellow-300 // "ALL"
            Line 3: t('landing_hero_line3') // "Favicon"
            Line 4: t('landing_hero_line4') // "Formats"

          P tagline (text-2xl, border-l-8 border-black)
            t('landing_hero_tagline') // "15+ formats in under 10 seconds..."

          LINK to="/upload"
            BUTTON primary style (bg-black text-yellow-300)
              t('landing_hero_cta') + " ->"  // "Upload Image ->"

        RIGHT COLUMN
          FormatDemoCard component
END
```

### `app/components/landing/FormatDemoCard.tsx`
**Objective:** Display a visual preview of favicon formats showing free vs premium distinction

**Pseudocode:**
```pseudocode
COMPONENT FormatDemoCard
  USE t from useTranslation

  DEFINE formats array:
    - { name: "favicon.ico", sizes: "16x16, 32x32, 48x48", isFree: true }
    - { name: "apple-touch-icon.png", sizes: "180x180", isFree: false }
    - { name: "manifest.json", sizes: "PWA Ready", isFree: false }

  RENDER div with white bg, thick border, slight rotation (rotate-1)
    FOR each format
      RENDER format row with:
        - Black square (placeholder icon)
        - Format name (font-black)
        - Size info (text-xs)
        - Badge: FREE (text-green-600) or €5 (text-red-600)
END
```

### `app/components/landing/FeaturesSection.tsx`
**Objective:** Display the "Why FaviconForge?" section with 6 feature cards

**Pseudocode:**
```pseudocode
COMPONENT FeaturesSection
  USE t from useTranslation

  DEFINE features array with i18n keys:
    - { titleKey: 'feature_speed_title', descKey: 'feature_speed_desc' }
    - { titleKey: 'feature_formats_title', descKey: 'feature_formats_desc' }
    - { titleKey: 'feature_price_title', descKey: 'feature_price_desc' }
    - { titleKey: 'feature_privacy_title', descKey: 'feature_privacy_desc' }
    - { titleKey: 'feature_production_title', descKey: 'feature_production_desc' }
    - { titleKey: 'feature_noaccount_title', descKey: 'feature_noaccount_desc' }

  RENDER section with black bg, yellow text
    CONTAINER max-w-7xl
      H3 section title with border-b-8 border-yellow-300
        t('landing_features_title') // "Why FaviconForge?"

      GRID 3 columns (md:grid-cols-3)
        FOR each feature
          RENDER FeatureCard with hover effect
            H4 title (text-2xl, font-black)
            P description (font-bold)
END
```

### `app/components/landing/PricingSection.tsx`
**Objective:** Display the Free vs Premium pricing comparison

**Pseudocode:**
```pseudocode
COMPONENT PricingSection
  USE t from useTranslation

  RENDER section with white bg
    CONTAINER max-w-5xl
      H3 section title centered
        t('landing_pricing_title') // "Pricing"

      GRID 2 columns (md:grid-cols-2)
        FREE TIER CARD (bg-yellow-300)
          Title: t('landing_pricing_free')
          Price: €0
          Features list (4 items with checkmarks)
          CTA button -> Link to /upload

        PREMIUM TIER CARD (bg-black text-yellow-300)
          "POPULAR" badge (rotated, red)
          Title: t('landing_pricing_premium')
          Price: €5
          Subtitle: ONE-TIME PAYMENT * LIFETIME ACCESS
          Features list (7 items with checkmarks)
          CTA button -> Link to /upload
END
```

### `app/components/Footer.tsx` (NEW - shared component)
**Objective:** Create shared footer component (same level as Header.tsx) with links grid matching the mockup. Will be used in root.tsx for all pages.

**Pseudocode:**
```pseudocode
COMPONENT Footer
  USE t from useTranslation

  RENDER footer with black bg, yellow text, border-t-8
    CONTAINER max-w-7xl
      GRID 3 columns (md:grid-cols-3)
        COLUMN 1 - Brand
          H4 "FaviconForge"
          P t('landing_footer_tagline')

        COLUMN 2 - Links
          H4 t('landing_footer_links')
          UL
            LI Link to /terms: t('landing_footer_terms')
            LI Link to /privacy: t('landing_footer_privacy')
            LI Link to /contact: t('landing_footer_contact')

        COLUMN 3 - Support
          H4 t('landing_footer_support')
          P email address

      DIVIDER (border-t-4)
      P copyright centered
        t('landing_footer_copyright')
END
```

### `app/root.tsx`
**Objective:** Add Footer component alongside Header so it appears on all pages

**Pseudocode:**
```pseudocode
IMPORT Footer from '~/components/Footer'

// In the App component return, after Outlet:
COMPONENT App
  ...existing code...
  RETURN
    ThemeProvider
      I18nextProvider
        HeaderStepProvider
          Header
          Outlet  // page content
          Footer  // NEW: add footer here
          Toaster
END
```

### `app/components/landing/index.ts`
**Objective:** Update exports to include new components, remove Footer (moved to shared) and EditorialDivider (unused)

**Pseudocode:**
```pseudocode
EXPORT HeroSection
EXPORT FormatDemoCard
EXPORT FeaturesSection
EXPORT PricingSection
// Remove Footer export (now in app/components/Footer.tsx)
// Remove EditorialDivider export (unused)
```

### `app/routes/home.tsx`
**Objective:** Compose all landing sections into the full page (Footer is in root.tsx)

**Pseudocode:**
```pseudocode
LOADER (existing)
  GET user session
  RETURN { user }

META
  title: "FaviconForge - Generate All Favicon Formats"
  description: "Generate all required favicon formats from a single image..."

COMPONENT Home
  RENDER div with yellow background
    HeroSection
    FeaturesSection
    PricingSection
    // Footer is rendered by root.tsx, not here
END
```

### `app/components/landing/Footer.tsx`
**Objective:** DELETE this file (moved to shared component at app/components/Footer.tsx)

### `app/routes/upload.tsx`
**Objective:** Remove Footer import and usage (Footer is now rendered by root.tsx)

**Pseudocode:**
```pseudocode
// REMOVE this line:
// import { Footer } from '~/components/landing/Footer'

// REMOVE <Footer /> from the component return
// The Footer will be rendered automatically by root.tsx
```

### `app/locales/en.json` (additions)
**Objective:** Add English translations for all landing page text

### `app/locales/es.json` (additions)
**Objective:** Add Spanish translations for all landing page text

### `app/components/landing/EditorialDivider.tsx`
**Objective:** DELETE this unused file

---

## Files Summary

**New files:**
- `app/components/Footer.tsx` - Shared footer (like Header)
- `app/components/landing/FormatDemoCard.tsx`
- `app/components/landing/FeaturesSection.tsx`
- `app/components/landing/PricingSection.tsx`

**Modified files:**
- `app/components/landing/HeroSection.tsx` - Replace content
- `app/components/landing/index.ts` - Update exports
- `app/routes/home.tsx` - Compose new sections
- `app/routes/upload.tsx` - Remove Footer import/usage (now in root.tsx)
- `app/root.tsx` - Add Footer
- `app/locales/en.json` - Add i18n keys
- `app/locales/es.json` - Add i18n keys

**Deleted files:**
- `app/components/landing/Footer.tsx` - Moved to shared
- `app/components/landing/EditorialDivider.tsx` - Unused

---

## 4. I18N

### Existing keys to reuse
- `login` - For header login button (already used via shared Header)

### New keys to create

| Key | English | Spanish |
|-----|---------|---------|
| `landing_hero_line1` | Generate | Genera |
| `landing_hero_line2` | ALL | TODOS |
| `landing_hero_line3` | Favicon | los Favicon |
| `landing_hero_line4` | Formats | Formatos |
| `landing_hero_tagline` | 15+ formats in under 10 seconds. No bullshit. | 15+ formatos en menos de 10 segundos. Sin rodeos. |
| `landing_hero_cta` | Upload Image | Subir Imagen |
| `landing_format_ico` | favicon.ico | favicon.ico |
| `landing_format_ico_sizes` | 16x16, 32x32, 48x48 | 16x16, 32x32, 48x48 |
| `landing_format_apple` | apple-touch-icon.png | apple-touch-icon.png |
| `landing_format_apple_sizes` | 180x180 | 180x180 |
| `landing_format_manifest` | manifest.json | manifest.json |
| `landing_format_manifest_sizes` | PWA Ready | Listo para PWA |
| `landing_format_free` | FREE | GRATIS |
| `landing_features_title` | Why FaviconForge? | Por que FaviconForge? |
| `feature_speed_title` | < 10 SEC | < 10 SEG |
| `feature_speed_desc` | Upload -> Process -> Download. Done. | Subir -> Procesar -> Descargar. Listo. |
| `feature_formats_title` | 15+ FORMATS | 15+ FORMATOS |
| `feature_formats_desc` | ICO, PNG, PWA, Apple, Windows, Safari | ICO, PNG, PWA, Apple, Windows, Safari |
| `feature_price_title` | €5 FOREVER | €5 PARA SIEMPRE |
| `feature_price_desc` | One payment. Lifetime access. No subscription. | Un pago. Acceso de por vida. Sin suscripcion. |
| `feature_privacy_title` | CLIENT-SIDE | EN TU NAVEGADOR |
| `feature_privacy_desc` | Your image never touches our servers | Tu imagen nunca toca nuestros servidores |
| `feature_production_title` | PRODUCTION READY | LISTO PARA PRODUCCION |
| `feature_production_desc` | Standards-compliant. Copy-paste HTML. | Cumple estandares. HTML listo para copiar. |
| `feature_noaccount_title` | NO ACCOUNT | SIN CUENTA |
| `feature_noaccount_desc` | Free tier works anonymously | El tier gratuito funciona anonimamente |
| `landing_pricing_title` | Pricing | Precios |
| `landing_pricing_free` | Free | Gratis |
| `landing_pricing_premium` | Premium | Premium |
| `landing_pricing_lifetime` | ONE-TIME PAYMENT * LIFETIME ACCESS | PAGO UNICO * ACCESO DE POR VIDA |
| `pricing_free_ico` | favicon.ico (16, 32, 48px) | favicon.ico (16, 32, 48px) |
| `pricing_free_png` | PNG formats (16, 32, 48px) | Formatos PNG (16, 32, 48px) |
| `pricing_free_html` | HTML snippet | Snippet HTML |
| `pricing_free_noaccount` | No account needed | Sin necesidad de cuenta |
| `pricing_premium_all` | Everything in Free | Todo lo de Gratis |
| `pricing_premium_apple` | Apple Touch Icons (180px) | Iconos Apple Touch (180px) |
| `pricing_premium_android` | Android/PWA (192, 512px) | Android/PWA (192, 512px) |
| `pricing_premium_maskable` | Maskable icons | Iconos maskable |
| `pricing_premium_manifest` | manifest.json + customization | manifest.json + personalizacion |
| `pricing_premium_windows` | Windows tiles | Tiles de Windows |
| `pricing_premium_docs` | Complete documentation | Documentacion completa |
| `landing_pricing_cta_free` | Start Free | Empezar Gratis |
| `landing_pricing_cta_premium` | Buy Premium | Comprar Premium |
| `landing_pricing_popular` | POPULAR | POPULAR |
| `landing_footer_tagline` | Generate all favicon formats in seconds. | Genera todos los formatos de favicon en segundos. |
| `landing_footer_links` | Links | Enlaces |
| `landing_footer_terms` | Terms of Service | Terminos de Servicio |
| `landing_footer_privacy` | Privacy Policy | Politica de Privacidad |
| `landing_footer_contact` | Contact | Contacto |
| `landing_footer_support` | Support | Soporte |
| `landing_footer_copyright` | © 2025 FAVICONFORGE * MADE WITH COFFEE AND CODE | © 2025 FAVICONFORGE * HECHO CON CAFE Y CODIGO |

---

## 5. E2E Test Plan

### Test: Landing page renders hero section correctly
- **Preconditions:** None
- **Steps:**
  1. Navigate to `/`
  2. Wait for page load
- **Expected:**
  - Hero headline "Generate ALL Favicon Formats" is visible
  - "Upload Image" button is visible and links to `/upload`

### Test: Landing page features section is visible
- **Preconditions:** None
- **Steps:**
  1. Navigate to `/`
  2. Scroll to features section
- **Expected:**
  - "Why FaviconForge?" title is visible
  - 6 feature cards are displayed

### Test: Landing page pricing section displays both tiers
- **Preconditions:** None
- **Steps:**
  1. Navigate to `/`
  2. Scroll to pricing section
- **Expected:**
  - Free tier card shows €0 and "Start Free" button
  - Premium tier card shows €5 and "Buy Premium" button
  - "POPULAR" badge is visible on premium card

### Test: Upload CTA navigates to upload page
- **Preconditions:** None
- **Steps:**
  1. Navigate to `/`
  2. Click "Upload Image" button in hero
- **Expected:**
  - URL changes to `/upload`
  - Upload page is displayed

### Test: Footer links are rendered
- **Preconditions:** None
- **Steps:**
  1. Navigate to `/`
  2. Scroll to footer
- **Expected:**
  - "Terms of Service" link is visible
  - "Privacy Policy" link is visible
  - "Contact" link is visible
  - Copyright text is visible

---

## 6. Definition of Done

1. **ALL relevant tests pass:**
   - `npm run test:e2e -- --retries=1` (landing page tests)
2. `npm run typecheck` passes
3. `npm run lint` passes
4. All acceptance criteria from section 1 are met
5. Landing page visually matches the mockup in `mockups/LandingPage.jsx`
6. All text is internationalized (English and Spanish)

---

_Document created: 2025-01-04_
_Based on mockup: mockups/LandingPage.jsx_
