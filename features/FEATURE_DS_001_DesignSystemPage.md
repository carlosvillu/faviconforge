# PLANNING - Design System Page

## 1. Natural Language Description

### Current State
FaviconForge has a brutalist design system documented in `docs/STYLE_GUIDE.md` with patterns for buttons, cards, forms, navigation, and badges. The project also uses shadcn/ui components (`app/components/ui/*`) as base building blocks. Currently, there is no live documentation page where developers or designers can see these components rendered and explore the design system.

### Expected End State
After this task, FaviconForge will have a public `/ds` page that serves as a living design system documentation. The page will:
- Display all brutalist components documented in the style guide
- Show shadcn/ui base components with brutalist styling
- Organize components by categories (Buttons, Cards, Forms, Navigation, Typography, etc.)
- Provide visual previews of each component in their rendered state
- Follow the brutalist aesthetic consistently throughout the page
- Be accessible without authentication

## 2. Technical Description

### High-level Approach
We will create a new public route `/ds` that renders a design system showcase page. The page will be organized into sections by component category, with each section displaying visual examples of the components.

### Architecture Decisions
- **Route**: `/ds` - public route (no authentication required)
- **Component Organization**: Category-based sections (Buttons, Cards, Forms, etc.)
- **Content Source**: Components from `app/components/ui/*` + brutalist patterns from `STYLE_GUIDE.md`
- **Styling**: Strict adherence to brutalist design (thick borders, bold fonts, high contrast)
- **Navigation**: In-page anchor navigation with category menu

### Integration Points
- shadcn/ui components from `app/components/ui/*`
- Custom brutalist components from `app/components/*`
- Style guide patterns from `docs/STYLE_GUIDE.md`
- Tailwind CSS utilities following brutalist conventions

## 2.1. Architecture Gate

This task creates a **new public documentation page** with minimal business logic.

### Pages are puzzles
- **Route module** (`app/routes/ds.tsx`): Composes design system showcase sections, minimal UI logic
  - No loader needed (static content)
  - No action needed (read-only page)
  - Component renders category sections with live component examples

### Loaders/actions are thin
- **No loader**: Page is static, no dynamic data fetching required
- **No action**: Page is read-only, no form submissions or mutations

### Business logic is not in components
- **No services needed**: This is a pure presentational/documentation page
- **No hooks needed**: No complex state management or orchestration required
- **Components**:
  - Main route renders the DS page structure
  - Extract category sections to `app/components/ds/*` for organization:
    - `DSButtonsSection.tsx` - Buttons category
    - `DSCardsSection.tsx` - Cards category
    - `DSFormsSection.tsx` - Forms category
    - `DSTypographySection.tsx` - Typography examples
    - `DSNavigationSection.tsx` - Navigation components
    - `DSBadgesSection.tsx` - Tags and badges
    - `DSShadcnSection.tsx` - shadcn/ui base components

## 3. Files to Change/Create

### `app/routes/ds.tsx`
**Objective:** Create the main design system page that composes all component showcase sections

**Pseudocode:**
```pseudocode
COMPONENT DesignSystemPage
  RENDER:
    - Header with brutalist styling
      - Title: "DESIGN SYSTEM" (text-7xl font-black uppercase)
      - Subtitle: "FaviconForge brutalist components" (text-2xl font-bold)

    - Sticky navigation menu (categories)
      - Buttons, Cards, Forms, Typography, Navigation, Badges, shadcn/ui
      - Anchor links to each section

    - Main content area:
      - Compose DSButtonsSection
      - Compose DSCardsSection
      - Compose DSFormsSection
      - Compose DSTypographySection
      - Compose DSNavigationSection
      - Compose DSBadgesSection
      - Compose DSShadcnSection

    - Footer component (reuse landing/Footer)

  STYLING:
    - Follow brutalist patterns (border-8 border-black, bg-yellow-300, etc.)
    - Use py-20 for section spacing
    - max-w-7xl mx-auto px-6 for container
END
```

### `app/components/ds/DSButtonsSection.tsx`
**Objective:** Showcase all button variants from the style guide with visual examples

**Pseudocode:**
```pseudocode
COMPONENT DSButtonsSection
  RENDER:
    - Section header (id="buttons" for anchor)
      - Title: "BUTTONS" (text-5xl font-black uppercase)
      - Description: brutalist button patterns

    - Grid of button examples (grid grid-cols-1 md:grid-cols-2 gap-8):
      - Primary Button (Black on Yellow)
        - Label: "Primary Button"
        - Live example with code pattern shown

      - Secondary Button (White/Outline)
        - Label: "Secondary Button"
        - Live example

      - Inverted Button (Yellow on Black)
        - Label: "Inverted Button"
        - Live example

      - Full Width Button
        - Label: "Full Width Button"
        - Live example

      - Login Button (Header style)
        - Label: "Login Button"
        - Live example

      - Large Download Button
        - Label: "Download CTA"
        - Live example with file size

  STYLING:
    - Each example in border-4 border-black p-6 bg-white
    - Example title: text-2xl font-black uppercase mb-4
END
```

### `app/components/ds/DSCardsSection.tsx`
**Objective:** Display card component patterns (Standard, Premium, Feature, Preview, Info Box)

**Pseudocode:**
```pseudocode
COMPONENT DSCardsSection
  RENDER:
    - Section header (id="cards")
      - Title: "CARDS" (text-5xl font-black uppercase)

    - Grid of card examples (grid grid-cols-1 md:grid-cols-2 gap-8):
      - Standard Card (Yellow Background)
        - Example from style guide (border-8 border-black bg-yellow-300)

      - Premium Card (Black Background)
        - With "POPULAR" rotated badge

      - Feature Card
        - Hover effect (hover:bg-yellow-300)

      - Preview Card
        - With badge and preview content

      - Info Box / Callout
        - With icon and description

  STYLING:
    - Examples wrapped in showcase containers
    - Each example labeled with text-2xl font-black
END
```

### `app/components/ds/DSFormsSection.tsx`
**Objective:** Show form patterns (Upload Area, Checklist, Input fields)

**Pseudocode:**
```pseudocode
COMPONENT DSFormsSection
  RENDER:
    - Section header (id="forms")
      - Title: "FORMS" (text-5xl font-black uppercase)

    - Form component examples:
      - Upload Area (Default state)
        - border-8 border-black p-12 bg-white
        - Icon, title, browse button

      - Upload Area (Drag Active)
        - border-8 border-black border-dashed bg-yellow-300

      - Upload Area (Success state)
        - border-8 border-black bg-green-200
        - Checkmark icon

      - Input Field (from shadcn/ui with brutalist style)
        - border-4 border-black

      - Textarea (brutalist style)

      - Checkbox (brutalist style)

      - Checklist pattern
        - space-y-3, checkmark icons in text-green-600

  STYLING:
    - Follow brutalist form patterns from style guide
END
```

### `app/components/ds/DSTypographySection.tsx`
**Objective:** Display typography scale and text patterns (Headlines, Body, Highlighting)

**Pseudocode:**
```pseudocode
COMPONENT DSTypographySection
  RENDER:
    - Section header (id="typography")
      - Title: "TYPOGRAPHY" (text-5xl font-black uppercase)

    - Typography examples:
      - Font family: Space Mono (monospace)

      - Font weights:
        - font-black (900) - "HEADLINES"
        - font-bold (700) - "Body text"

      - Font sizes scale:
        - text-7xl: "Hero Headline"
        - text-6xl: "Page Title"
        - text-5xl: "Section Title"
        - text-4xl, 3xl, 2xl, xl, lg, base, sm, xs
        - Each with pixel size and usage note

      - Text highlighting patterns:
        - Inverted box: bg-black text-yellow-300 px-2
        - Examples from style guide

      - UPPERCASE pattern
        - All headings uppercase

  STYLING:
    - Each example in border-4 border-black p-6
    - Live rendered text at each size
END
```

### `app/components/ds/DSNavigationSection.tsx`
**Objective:** Show navigation components (Header, Footer, Progress Bar)

**Pseudocode:**
```pseudocode
COMPONENT DSNavigationSection
  RENDER:
    - Section header (id="navigation")
      - Title: "NAVIGATION" (text-5xl font-black uppercase)

    - Navigation examples:
      - Header (default style)
        - border-b-8 border-black bg-white
        - Logo + Login button

      - Header (step variant)
        - border-b-8 border-black bg-yellow-300
        - With step indicator

      - Progress Bar
        - bg-black h-4
        - Yellow fill with border-r-4 border-black

      - Footer
        - Reuse actual Footer component as example

  STYLING:
    - Scaled-down versions for preview
    - border-4 border-black containers
END
```

### `app/components/ds/DSBadgesSection.tsx`
**Objective:** Display badge/tag patterns (Premium, Success, Inline)

**Pseudocode:**
```pseudocode
COMPONENT DSBadgesSection
  RENDER:
    - Section header (id="badges")
      - Title: "BADGES & TAGS" (text-5xl font-black uppercase)

    - Badge examples:
      - Premium Badge (Rotated)
        - bg-red-600 text-white rotate-12
        - "POPULAR" or "PREMIUM"

      - Inline Badge
        - bg-red-600 text-white px-3 py-1 text-xs font-black

      - Success Badge
        - bg-green-600 text-white
        - With checkmark

      - FREE badge
        - text-green-600 font-black

  STYLING:
    - Examples on different backgrounds to show contrast
END
```

### `app/components/ds/DSShadcnSection.tsx`
**Objective:** Show shadcn/ui base components with brutalist styling applied

**Pseudocode:**
```pseudocode
COMPONENT DSShadcnSection
  RENDER:
    - Section header (id="shadcn")
      - Title: "shadcn/ui COMPONENTS" (text-5xl font-black uppercase)
      - Note: "Base components styled with brutalist theme"

    - shadcn/ui component examples:
      - Button (from app/components/ui/button.tsx)
        - All variants: default, destructive, outline, secondary, ghost, link

      - Card (from app/components/ui/card.tsx)
        - CardHeader, CardTitle, CardDescription, CardContent, CardFooter

      - Input (from app/components/ui/input.tsx)
        - Text input with brutalist border

      - Textarea (from app/components/ui/textarea.tsx)

      - Checkbox (from app/components/ui/checkbox.tsx)

      - Label (from app/components/ui/label.tsx)

      - Dialog (from app/components/ui/dialog.tsx)
        - Example with trigger + content

      - Dropdown Menu (from app/components/ui/dropdown-menu.tsx)
        - Example with items

      - Alert Dialog (from app/components/ui/alert-dialog.tsx)

  STYLING:
    - Import and render actual shadcn components
    - Show how brutalist theme affects them
END
```

### `app/routes.ts`
**Objective:** Register the new `/ds` route

**Pseudocode:**
```pseudocode
ADD route registration:
  - path: "/ds"
  - component: DSPage (from app/routes/ds.tsx)
  - public: true (no authentication required)
```

## 4. I18N

### Existing keys to reuse
- `footer_copyright` - For footer in DS page

### New keys to create
| Key | English | Spanish |
|-----|---------|---------|
| `ds_page_title` | Design System | Sistema de Diseño |
| `ds_page_subtitle` | FaviconForge brutalist components | Componentes brutalist de FaviconForge |
| `ds_buttons_title` | Buttons | Botones |
| `ds_cards_title` | Cards | Tarjetas |
| `ds_forms_title` | Forms | Formularios |
| `ds_typography_title` | Typography | Tipografía |
| `ds_navigation_title` | Navigation | Navegación |
| `ds_badges_title` | Badges & Tags | Etiquetas y Tags |
| `ds_shadcn_title` | shadcn/ui Components | Componentes shadcn/ui |
| `ds_shadcn_note` | Base components styled with brutalist theme | Componentes base con tema brutalist |
| `ds_primary_button_label` | Primary Button | Botón Primario |
| `ds_secondary_button_label` | Secondary Button | Botón Secundario |
| `ds_inverted_button_label` | Inverted Button | Botón Invertido |
| `ds_full_width_button_label` | Full Width Button | Botón Ancho Completo |
| `ds_login_button_label` | Login Button | Botón Login |
| `ds_download_button_label` | Download CTA | CTA Descarga |
| `ds_standard_card_label` | Standard Card | Tarjeta Estándar |
| `ds_premium_card_label` | Premium Card | Tarjeta Premium |
| `ds_feature_card_label` | Feature Card | Tarjeta Feature |
| `ds_preview_card_label` | Preview Card | Tarjeta Preview |
| `ds_info_box_label` | Info Box / Callout | Caja Info / Callout |

## 5. E2E Test Plan

### Test: DS page loads and displays all sections
- **Preconditions:** None (public page)
- **Steps:**
  1. Navigate to `/ds`
  2. Wait for page to load
- **Expected:**
  - Page title "DESIGN SYSTEM" is visible
  - All category sections are rendered (Buttons, Cards, Forms, Typography, Navigation, Badges, shadcn/ui)
  - Footer is visible

### Test: Navigation menu works (anchor links)
- **Preconditions:** User is on `/ds`
- **Steps:**
  1. Click "Buttons" in navigation menu
  2. Verify scroll to buttons section
  3. Click "Cards" in navigation menu
  4. Verify scroll to cards section
- **Expected:**
  - Page scrolls smoothly to each section
  - URL hash updates (#buttons, #cards, etc.)

### Test: All button variants are displayed
- **Preconditions:** User is on `/ds`
- **Steps:**
  1. Scroll to Buttons section
  2. Verify all button variants are visible
- **Expected:**
  - Primary Button (Black on Yellow) is rendered
  - Secondary Button (White/Outline) is rendered
  - Inverted Button (Yellow on Black) is rendered
  - Full Width Button is rendered
  - Login Button is rendered
  - Large Download Button is rendered

### Test: All card variants are displayed
- **Preconditions:** User is on `/ds`
- **Steps:**
  1. Scroll to Cards section
  2. Verify all card variants are visible
- **Expected:**
  - Standard Card (Yellow) is rendered with border-8 border-black
  - Premium Card (Black) is rendered with POPULAR badge
  - Feature Card is rendered
  - Preview Card is rendered
  - Info Box is rendered

### Test: shadcn/ui components are displayed
- **Preconditions:** User is on `/ds`
- **Steps:**
  1. Scroll to shadcn/ui section
  2. Verify shadcn components are rendered
- **Expected:**
  - Button component (all variants) visible
  - Card component visible
  - Input component visible
  - Checkbox component visible
  - Dialog example visible

### Test: Brutalist styling is applied consistently
- **Preconditions:** User is on `/ds`
- **Steps:**
  1. Inspect page styling
  2. Verify brutalist patterns
- **Expected:**
  - Thick borders (border-4, border-8) are visible
  - Font weights are bold/black (no normal weight)
  - Colors are high contrast (black, white, yellow-300)
  - No rounded corners on main UI elements
  - Space Mono font is applied

### Test: Mobile responsive layout
- **Preconditions:** User is on `/ds` on mobile viewport (375px)
- **Steps:**
  1. Resize to mobile width
  2. Scroll through all sections
- **Expected:**
  - Grids collapse to single column (grid-cols-1)
  - No horizontal overflow
  - Navigation menu is accessible
  - All components are visible and readable

---

**End of Planning**

This plan creates a comprehensive, public design system documentation page that showcases all FaviconForge brutalist components and shadcn/ui base components organized by category with visual previews.
