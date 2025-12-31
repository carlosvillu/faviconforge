# Style Guide - FaviconForge

## Overview

FaviconForge embraces a **brutalist design philosophy** - bold, unapologetic, and functional. The design system prioritizes clarity, impact, and memorable visual identity through thick borders, high contrast colors, and powerful typography. No soft shadows, no gradients on backgrounds, no rounded corners - just raw, confident design.

---

## Table of Contents
- [Color Palette](#color-palette)
- [Typography](#typography)
- [Spacing System](#spacing-system)
- [Component Styles](#component-styles)
- [Shadows & Elevation](#shadows--elevation)
- [Animations & Transitions](#animations--transitions)
- [Border Radius](#border-radius)
- [Borders](#borders)
- [Opacity & Transparency](#opacity--transparency)
- [Z-Index System](#z-index-system)
- [CSS Variables](#css-variables)
- [Common Tailwind CSS Usage](#common-tailwind-css-usage)
- [Example Components](#example-components)
- [Accessibility](#accessibility)
- [Implementation Best Practices](#implementation-best-practices)
- [Common Patterns to Avoid](#common-patterns-to-avoid)
- [Future Enhancement Suggestions](#future-enhancement-suggestions)
- [Testing Checklist](#testing-checklist)
- [Version History](#version-history)

---

## Color Palette

### Primary Brand Colors
| Name | Hex | Tailwind Class | Usage |
|------|-----|----------------|-------|
| Yellow (Primary) | `#FDE047` | `bg-yellow-300` / `text-yellow-300` | Primary brand color, backgrounds, highlights |
| Black (Ink) | `#000000` | `bg-black` / `text-black` | Text, borders, primary buttons |
| White (Paper) | `#FFFFFF` | `bg-white` / `text-white` | Backgrounds, inverted text |

### Semantic Colors
| Name | Hex | Tailwind Class | Usage |
|------|-----|----------------|-------|
| Success Green | `#059669` | `text-green-600` | Success states, checkmarks, FREE labels |
| Light Green | `#4ADE80` | `text-green-400` | Success on dark backgrounds |
| Error Red | `#DC2626` | `text-red-600` / `bg-red-600` | Premium tags, alerts, destructive actions |
| Blue (Windows) | `#2563EB` | `bg-blue-600` | Windows tile previews |

### Gradient Colors (Preview Backgrounds Only)
| Name | Gradient | Usage |
|------|----------|-------|
| iOS Preview | `from-blue-400 to-purple-500` | iOS home screen mockup |
| Android Preview | `from-green-400 to-teal-500` | Android home screen mockup |
| PWA Preview | `from-yellow-300 to-white` | PWA install dialog mockup |

### Color Usage Examples
```tsx
// Primary backgrounds
<div className="bg-yellow-300" />  // Brand yellow
<div className="bg-black" />        // Dark sections
<div className="bg-white" />        // Light sections

// Text colors
<p className="text-black" />              // Primary text
<p className="text-white" />              // On dark backgrounds
<p className="text-yellow-300" />         // Brand accent on dark
<p className="text-green-600" />          // Success/FREE labels
<p className="text-red-600" />            // Premium/price labels
<p className="text-gray-600" />           // Secondary/muted text
```

---

## Typography

### Font Families
| Name | Value | Usage |
|------|-------|-------|
| Mono | `Space Mono, monospace` | All text (brutalist aesthetic) |
| Sans (shadcn fallback) | `Inter, system-ui, sans-serif` | UI components fallback |

### Font Weights
| Name | Value | Tailwind Class | Usage |
|------|-------|----------------|-------|
| Bold | 700 | `font-bold` | Body text, descriptions, secondary content |
| Black | 900 | `font-black` | Headlines, titles, CTAs, emphasis |

### Font Sizes
| Name | Size | Tailwind Class | Usage |
|------|------|----------------|-------|
| XS | 0.75rem (12px) | `text-xs` | Small labels, file sizes, metadata |
| SM | 0.875rem (14px) | `text-sm` | Step indicators, footer links |
| Base | 1rem (16px) | `text-base` | Body text (rarely used, prefer lg) |
| LG | 1.125rem (18px) | `text-lg` | Secondary descriptions |
| XL | 1.25rem (20px) | `text-xl` | Section subtitles, feature titles |
| 2XL | 1.5rem (24px) | `text-2xl` | Section headers, feature cards |
| 3XL | 1.875rem (30px) | `text-3xl` | Page section titles |
| 4XL | 2.25rem (36px) | `text-4xl` | Secondary page titles |
| 5XL | 3rem (48px) | `text-5xl` | Section titles |
| 6XL | 3.75rem (60px) | `text-6xl` | Page titles |
| 7XL | 4.5rem (72px) | `text-7xl` | Hero headlines |

### Text Styles

#### Headlines (UPPERCASE, font-black)
```tsx
// Hero headline
<h1 className="text-7xl font-black uppercase leading-none">
  Generate
  <br />
  <span className="bg-black text-yellow-300 px-2">ALL</span>
  <br />
  Favicon
  <br />
  Formats
</h1>

// Page title
<h2 className="text-6xl font-black uppercase mb-4 leading-none">
  Upload Your
  <br />
  <span className="bg-black text-white px-2">Image</span>
</h2>

// Section title
<h3 className="text-5xl font-black uppercase mb-12 border-b-8 border-yellow-300 pb-4">
  Why FaviconForge?
</h3>
```

#### Body Text (font-bold)
```tsx
// Tagline with border accent
<p className="text-2xl font-bold border-l-8 border-black pl-4">
  15+ formats in under 10 seconds. No bullshit.
</p>

// Description text
<p className="font-bold text-lg">
  Square images only. Minimum 512x512px. Max 10MB.
</p>
```

#### Text Highlighting Pattern
```tsx
// Highlight word in heading (inverted box)
<span className="bg-black text-yellow-300 px-2">ALL</span>
<span className="bg-black text-white px-2">Image</span>
```

---

## Spacing System

### Base Spacing Scale
| Name | Value | Pixels | Usage |
|------|-------|--------|-------|
| 1 | 0.25rem | 4px | Tight spacing |
| 2 | 0.5rem | 8px | List item gaps |
| 3 | 0.75rem | 12px | Small gaps |
| 4 | 1rem | 16px | Standard padding |
| 6 | 1.5rem | 24px | Card padding, section gaps |
| 8 | 2rem | 32px | Large padding |
| 12 | 3rem | 48px | Section margins |
| 16 | 4rem | 64px | XL spacing |
| 20 | 5rem | 80px | Section padding (py-20) |

### Common Spacing Patterns
```tsx
// Page section
<section className="py-20">
  <div className="max-w-7xl mx-auto px-6">
    {/* Content */}
  </div>
</section>

// Card padding
<div className="border-8 border-black p-8">
  {/* Card content */}
</div>

// Feature card
<div className="border-4 border-yellow-300 p-6">
  {/* Feature content */}
</div>

// Content gaps
<div className="space-y-8">  // Large vertical gaps
<div className="space-y-4">  // Medium vertical gaps
<div className="gap-4">      // Flex/grid gaps
```

### Container Widths
```tsx
// Maximum content width
<div className="max-w-7xl mx-auto" />   // 80rem - Full sections
<div className="max-w-6xl mx-auto" />   // 72rem - Main content
<div className="max-w-5xl mx-auto" />   // 64rem - Pricing
<div className="max-w-4xl mx-auto" />   // 56rem - Upload/forms
```

---

## Component Styles

### Buttons

#### Primary Button (Black on Yellow)
```tsx
<button className="bg-black text-yellow-300 px-8 py-4 font-black uppercase text-lg border-4 border-black hover:translate-x-1 hover:translate-y-1 transition-transform">
  Upload Image ->
</button>
```

#### Secondary Button (White/Outline)
```tsx
<button className="bg-white text-black px-8 py-4 font-bold uppercase text-lg border-4 border-black hover:translate-x-1 hover:translate-y-1 transition-transform">
  Learn More
</button>
```

#### Inverted Button (Yellow on Black)
```tsx
<button className="bg-yellow-300 text-black border-4 border-yellow-300 py-4 font-black uppercase hover:bg-white hover:border-white transition-colors">
  Buy Premium
</button>
```

#### Full Width Button
```tsx
<button className="w-full bg-black border-4 border-black py-4 font-black uppercase hover:bg-yellow-300 hover:text-black transition-colors">
  Start Free
</button>
```

#### Login Button (Header)
```tsx
<button className="bg-black text-white px-6 py-3 font-bold uppercase text-sm border-4 border-black hover:bg-white hover:text-black transition-colors">
  Login
</button>
```

#### Large Download Button
```tsx
<button className="bg-black text-yellow-300 px-12 py-6 font-black uppercase text-xl border-4 border-black hover:bg-white hover:text-black transition-all hover:scale-105">
  Download Free
  <div className="text-xs font-bold mt-1">ZIP * 15 KB</div>
</button>
```

### Cards

#### Standard Card (Yellow Background)
```tsx
<div className="border-8 border-black p-8 bg-yellow-300">
  <div className="text-3xl font-black uppercase mb-4">Free</div>
  <div className="text-6xl font-black mb-6">0</div>
  {/* Content */}
</div>
```

#### Premium Card (Black Background)
```tsx
<div className="border-8 border-black p-8 bg-black text-yellow-300 relative overflow-hidden">
  <div className="absolute top-0 right-0 bg-red-600 text-white px-4 py-1 font-black text-sm rotate-12 transform translate-x-4 -translate-y-2">
    POPULAR
  </div>
  {/* Content */}
</div>
```

#### Feature Card
```tsx
<div className="border-4 border-yellow-300 p-6 hover:bg-yellow-300 hover:text-black transition-colors">
  <h4 className="text-2xl font-black mb-3">< 10 SEC</h4>
  <p className="font-bold">Upload -> Process -> Download. Done.</p>
</div>
```

#### Preview Card (with Badge)
```tsx
<div className="border-8 border-black p-6 bg-white">
  <h3 className="text-xl font-black uppercase mb-4 border-b-4 border-black pb-2">
    iOS Home Screen
  </h3>
  {/* Preview content */}
  <p className="text-sm font-bold mt-3">180x180px apple-touch-icon</p>
  <span className="inline-block bg-red-600 text-white px-3 py-1 text-xs font-black uppercase mt-2">
    PREMIUM
  </span>
</div>
```

#### Info Box / Callout
```tsx
<div className="border-8 border-black p-8 bg-yellow-300">
  <div className="flex items-start gap-4">
    <div className="text-4xl">light bulb emoji</div>
    <div>
      <h3 className="text-2xl font-black uppercase mb-2">Looks Good?</h3>
      <p className="font-bold text-lg">
        These previews show how your favicon will appear across different platforms.
      </p>
    </div>
  </div>
</div>
```

### Forms

#### Upload Area
```tsx
<div className="border-8 border-black p-12 bg-white">
  <div className="text-center space-y-8">
    <div className="w-32 h-32 mx-auto border-8 border-black bg-yellow-300 flex items-center justify-center">
      {/* Icon */}
    </div>
    <p className="text-3xl font-black uppercase mb-4">DRAG & DROP</p>
    <p className="text-xl font-bold mb-6">or click to browse</p>
    {/* File input */}
  </div>
</div>
```

#### Upload Area (Drag Active State)
```tsx
<div className="border-8 border-black border-dashed p-12 bg-yellow-300">
  {/* Same structure, different background */}
</div>
```

#### Upload Area (Success State)
```tsx
<div className="border-8 border-black p-12 bg-green-200">
  <div className="w-32 h-32 mx-auto border-8 border-black bg-white flex items-center justify-center">
    {/* Checkmark icon in text-green-600 */}
  </div>
  <p className="text-3xl font-black uppercase text-green-600 mb-2">
    FILE UPLOADED!
  </p>
</div>
```

#### Checklist
```tsx
<ul className="space-y-3">
  <li className="flex items-start gap-3 font-bold text-lg">
    <span className="text-2xl text-green-600">checkmark</span>
    <span>Square aspect ratio (1:1)</span>
  </li>
</ul>
```

### Navigation

#### Header
```tsx
<header className="border-b-8 border-black bg-white p-6">
  <div className="max-w-7xl mx-auto flex justify-between items-center">
    <h1 className="text-4xl font-black uppercase tracking-tight">
      FaviconForge
    </h1>
    <button className="bg-black text-white px-6 py-3 font-bold uppercase text-sm border-4 border-black hover:bg-white hover:text-black transition-colors">
      Login
    </button>
  </div>
</header>
```

#### Header (Step Variant)
```tsx
<header className="border-b-8 border-black bg-yellow-300 p-6">
  <div className="max-w-7xl mx-auto flex justify-between items-center">
    <h1 className="text-3xl font-black uppercase tracking-tight">
      FaviconForge
    </h1>
    <div className="flex gap-4 items-center">
      <span className="font-bold text-sm">STEP 1/3: UPLOAD</span>
      <button>...</button>
    </div>
  </div>
</header>
```

#### Progress Bar
```tsx
<div className="bg-black h-4 relative">
  <div className="bg-yellow-300 h-full w-1/3 border-r-4 border-black"></div>
</div>
```

#### Footer
```tsx
<footer className="bg-black text-yellow-300 border-t-8 border-yellow-300 py-12">
  <div className="max-w-7xl mx-auto px-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
      {/* Footer columns */}
    </div>
    <div className="border-t-4 border-yellow-300 pt-8 text-center font-black">
      copyright 2025 FAVICONFORGE * MADE WITH coffee AND CODE
    </div>
  </div>
</footer>
```

### Tags / Badges

#### Premium Badge (Rotated)
```tsx
<div className="absolute top-0 right-0 bg-red-600 text-white px-4 py-1 font-black text-sm rotate-12 transform translate-x-4 -translate-y-2">
  POPULAR
</div>
```

#### Inline Badge
```tsx
<span className="inline-block bg-red-600 text-white px-3 py-1 text-xs font-black uppercase mt-2">
  PREMIUM
</span>
```

#### Success Badge
```tsx
<span className="bg-green-600 text-white px-3 py-1 font-black text-xs uppercase border-2 border-black">
  checkmark PREMIUM
</span>
```

---

## Shadows & Elevation

### Brutalist Shadow
This design system uses **hard shadows only** - no soft shadows or blur.

```css
.brutalist-shadow {
  box-shadow: 8px 8px 0 0 #000;
}

.brutalist-shadow-hover:hover {
  box-shadow: 4px 4px 0 0 #000;
  transform: translate(4px, 4px);
}
```

### Usage
```tsx
// Apply hard shadow to elevated elements
<div className="brutalist-shadow">
  {/* Content */}
</div>

// Interactive elements with press effect
<button className="brutalist-shadow brutalist-shadow-hover">
  Click Me
</button>
```

### Shadow Scale (if needed)
| Name | CSS Value | Usage |
|------|-----------|-------|
| shadow-sm | `4px 4px 0 0 #000` | Subtle elevation |
| shadow | `8px 8px 0 0 #000` | Default brutalist shadow |
| shadow-lg | `12px 12px 0 0 #000` | Strong elevation |

---

## Animations & Transitions

### Hover Translations
The primary interaction pattern uses translate for a "pressing" effect.

```tsx
// Standard hover translate
className="hover:translate-x-1 hover:translate-y-1 transition-transform"

// Scale hover (for CTAs)
className="hover:scale-105 transition-transform"
```

### Color Transitions
```tsx
// Background color change
className="transition-colors"

// All properties
className="transition-all"
```

### Duration
All transitions use implicit Tailwind defaults (150ms). For custom timing:
```tsx
className="transition-all duration-200"
```

### Custom Animations (from app.css)
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-in {
  animation: fadeInUp 0.3s ease-out forwards;
}
```

---

## Border Radius

### Brutalist Principle: NO ROUNDED CORNERS

This design system intentionally avoids rounded corners for core UI elements. Sharp edges reinforce the brutalist aesthetic.

| Element | Radius | Notes |
|---------|--------|-------|
| Buttons | `rounded-none` (default) | Sharp corners |
| Cards | `rounded-none` (default) | Sharp corners |
| Inputs | `rounded-none` (preferred) | Sharp corners |

### Exception: Mobile App Previews
Only iOS/Android mockup icons use rounded corners to accurately represent those platforms:
```tsx
<div className="w-16 h-16 rounded-2xl">
  {/* App icon preview */}
</div>
```

---

## Borders

### Border Widths
| Width | Tailwind Class | Usage |
|-------|----------------|-------|
| 2px | `border-2` | Subtle dividers, input fields |
| 4px | `border-4` | Cards, buttons, feature boxes |
| 8px | `border-8` | Major sections, headers, primary cards |

### Usage Examples
```tsx
// Header/footer borders
<header className="border-b-8 border-black" />
<footer className="border-t-8 border-yellow-300" />

// Cards
<div className="border-8 border-black p-8" />        // Primary card
<div className="border-4 border-yellow-300 p-6" />   // Feature card
<div className="border-4 border-black p-4" />        // Nested elements

// Section dividers
<div className="border-b-4 border-black pb-4" />     // Title underline
<div className="border-l-8 border-black pl-4" />     // Quote/callout accent

// Progress bar divider
<div className="border-r-4 border-black" />
```

---

## Opacity & Transparency

### Background Overlays
Brutalist design avoids transparency. Use solid colors instead.

```tsx
// Correct (solid)
<div className="bg-black" />
<div className="bg-white" />

// Avoid (transparent)
<div className="bg-black/50" />  // Not brutalist
```

### Exception: Dialog Overlay (shadcn/ui)
Only modal overlays use opacity for usability:
```tsx
className="bg-ink/80"  // Dialog backdrop only
```

---

## Z-Index System

### 4-Layer System
| Layer | Z-Index | Tailwind Class | Usage |
|-------|---------|----------------|-------|
| Base | 0 | (default) | Default content |
| Elevated | 10 | `z-10` | Dropdowns, tooltips |
| Overlay | 50 | `z-50` | Modals, sheets, dialogs |
| Top | 100 | `z-[100]` | Toasts, fixed navigation |

### Navigation Bar
```tsx
<nav className="fixed bottom-0 left-0 right-0 z-50">
  {/* Fixed navigation */}
</nav>
```

---

## CSS Variables

### Theme Colors (from app.css)
```css
:root {
  --radius: 0.5rem;
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  --card: 0 0% 100%;
  --card-foreground: 0 0% 3.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 0 0% 3.9%;
  --primary: 0 0% 9%;
  --primary-foreground: 0 0% 98%;
  --secondary: 0 0% 96.1%;
  --secondary-foreground: 0 0% 9%;
  --muted: 0 0% 96.1%;
  --muted-foreground: 0 0% 45.1%;
  --accent: 0 0% 96.1%;
  --accent-foreground: 0 0% 9%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;
  --border: 0 0% 89.8%;
  --input: 0 0% 89.8%;
  --ring: 0 0% 3.9%;
}

.dark {
  --background: 0 0% 3.9%;
  --foreground: 0 0% 98%;
  /* ... dark mode overrides */
}
```

### Custom Properties for Brutalist Theme
Consider adding:
```css
:root {
  --brand-yellow: #FDE047;
  --brand-black: #000000;
  --brand-white: #FFFFFF;
  --border-thick: 8px;
  --border-medium: 4px;
}
```

---

## Common Tailwind CSS Usage

### Most Used Utility Classes

#### Typography
```tsx
font-black          // 900 weight - headlines
font-bold           // 700 weight - body text
uppercase           // ALL CAPS - brutalist headings
tracking-tight      // Tight letter-spacing for logo
leading-none        // 1.0 line-height for headlines
```

#### Colors
```tsx
bg-yellow-300       // Primary brand background
bg-black            // Dark sections
bg-white            // Light sections
text-yellow-300     // Accent on dark
text-green-600      // Success/free
text-red-600        // Premium/error
```

#### Borders
```tsx
border-8            // Thick borders (headers, major cards)
border-4            // Medium borders (buttons, cards)
border-black        // Primary border color
border-yellow-300   // On dark backgrounds
```

#### Layout
```tsx
max-w-7xl mx-auto px-6   // Standard container
py-20                     // Section vertical padding
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8  // Feature grid
flex justify-between items-center  // Header layout
```

### Layout Patterns

#### Centered Container
```tsx
<div className="max-w-7xl mx-auto px-6">
  {/* Content */}
</div>
```

#### Two-Column Hero
```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
  <div className="space-y-8">
    {/* Left: Text content */}
  </div>
  <div className="relative">
    {/* Right: Visual demo */}
  </div>
</div>
```

#### Three-Column Feature Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
  {features.map(feature => (
    <div className="border-4 border-yellow-300 p-6">
      {/* Feature card */}
    </div>
  ))}
</div>
```

#### Two-Column Pricing
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
  <div className="border-8 border-black p-8 bg-yellow-300">
    {/* Free tier */}
  </div>
  <div className="border-8 border-black p-8 bg-black text-yellow-300">
    {/* Premium tier */}
  </div>
</div>
```

### Responsive Patterns
```tsx
// Mobile-first text sizing
<h2 className="text-4xl md:text-6xl font-black" />

// Hidden on mobile
<span className="hidden md:block" />

// Grid columns responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" />

// Flex direction responsive
<div className="flex flex-col md:flex-row" />
```

---

## Example Components

### Reference Component: Feature Card
```tsx
// From LandingPage.jsx - Features Grid
<div className="border-4 border-yellow-300 p-6 hover:bg-yellow-300 hover:text-black transition-colors">
  <h4 className="text-2xl font-black mb-3">< 10 SEC</h4>
  <p className="font-bold">Upload -> Process -> Download. Done.</p>
</div>
```

### Reference Component: Pricing Card (Free)
```tsx
// From LandingPage.jsx - Pricing Section
<div className="border-8 border-black p-8 bg-yellow-300">
  <div className="text-3xl font-black uppercase mb-4">Free</div>
  <div className="text-6xl font-black mb-6">0</div>
  <ul className="space-y-3 mb-8 font-bold">
    <li className="flex items-start gap-2">
      <span className="text-2xl">checkmark</span>
      <span>favicon.ico (16, 32, 48px)</span>
    </li>
    {/* More items */}
  </ul>
  <button className="w-full bg-white border-4 border-black py-4 font-black uppercase hover:bg-black hover:text-white transition-colors">
    Start Free
  </button>
</div>
```

### Reference Component: Upload Area
```tsx
// From UploadPage.jsx
<div className="border-8 border-black p-12 bg-white">
  <div className="text-center space-y-8">
    <div className="w-32 h-32 mx-auto border-8 border-black bg-yellow-300 flex items-center justify-center">
      <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
        <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
      </svg>
    </div>

    <div>
      <p className="text-3xl font-black uppercase mb-4">DRAG & DROP</p>
      <p className="text-xl font-bold mb-6">or click to browse</p>

      <label className="cursor-pointer">
        <input type="file" className="hidden" accept="image/png,image/jpeg,image/webp" />
        <span className="bg-black text-white px-8 py-4 font-black uppercase inline-block border-4 border-black hover:bg-yellow-300 hover:text-black transition-colors">
          Browse Files
        </span>
      </label>
    </div>

    <div className="border-t-4 border-black pt-8">
      <p className="font-bold text-sm uppercase">Accepted formats:</p>
      <p className="font-black text-2xl mt-2">PNG * JPEG * WebP</p>
    </div>
  </div>
</div>
```

### Reference Component: Preview Card
```tsx
// From PreviewPage.jsx
<div className="border-8 border-black p-6 bg-yellow-300">
  <h3 className="text-xl font-black uppercase mb-4 border-b-4 border-black pb-2">
    Browser Tab
  </h3>
  <div className="bg-white border-4 border-black p-4">
    <div className="flex items-center gap-3 bg-gray-100 border-2 border-gray-400 px-3 py-2">
      <div className="w-4 h-4 bg-black"></div>
      <span className="text-sm font-bold">My Website</span>
      <span className="ml-auto text-xs font-bold text-gray-500">x</span>
    </div>
  </div>
  <p className="text-sm font-bold mt-3">16x16px favicon.ico</p>
</div>
```

### Reference Component: Step Card
```tsx
// From SuccessPage.jsx
<div className="border-4 border-black p-6 bg-yellow-300">
  <div className="flex gap-6">
    <div className="flex-shrink-0">
      <div className="w-16 h-16 bg-black text-yellow-300 border-4 border-black flex items-center justify-center text-3xl font-black">
        1
      </div>
    </div>
    <div className="flex-1">
      <h4 className="text-2xl font-black uppercase mb-2">Download Your Premium Package</h4>
      <p className="font-bold text-lg mb-4">Get all 15+ favicon formats, manifest.json, and complete documentation.</p>
      <button className="bg-black text-yellow-300 px-6 py-3 font-black uppercase text-sm border-4 border-black hover:scale-105 transition-transform">
        Download Premium ZIP
      </button>
    </div>
  </div>
</div>
```

---

## Accessibility

### WCAG AA Compliance

This design system maintains WCAG 2.1 AA compliance despite its high-contrast brutalist aesthetic.

### Contrast Ratios
| Element | Colors | Contrast Ratio | Status |
|---------|--------|----------------|--------|
| Black text on Yellow | #000 on #FDE047 | 14.5:1 | Passes AAA |
| Yellow text on Black | #FDE047 on #000 | 14.5:1 | Passes AAA |
| White text on Black | #FFF on #000 | 21:1 | Passes AAA |
| Black text on White | #000 on #FFF | 21:1 | Passes AAA |
| Green text on Yellow | #059669 on #FDE047 | 4.5:1 | Passes AA |

### Focus States
```tsx
// Standard focus pattern
className="focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2"

// Button focus (from existing components)
className="focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
```

### Keyboard Navigation
- All interactive elements are focusable
- Tab order follows visual layout
- Enter/Space activates buttons
- Escape closes modals/dropdowns

### Screen Reader Considerations
```tsx
// Always include aria-label for icon-only buttons
<button aria-label="User menu">
  {/* Avatar */}
</button>

// Use semantic HTML
<header>, <main>, <footer>, <nav>, <section>

// Provide alt text for meaningful images
<img alt="Preview of favicon in browser tab" />
```

---

## Implementation Best Practices

1. **Use Brutalist Patterns:** Always use thick borders (4px or 8px) instead of shadows or subtle effects.

2. **Font Weight Consistency:** Headlines = `font-black`, Body = `font-bold`. Never use normal weight.

3. **UPPERCASE for Impact:** All headings and CTAs should be uppercase.

4. **High Contrast Colors:** Stick to black, white, and yellow-300 as primary colors.

5. **No Rounded Corners:** Avoid `rounded-*` classes except for mobile app icon previews.

6. **Border Accents:** Use `border-l-8 border-black pl-4` for callout text.

7. **Hover Effects:** Prefer `translate` and `scale` over color changes for primary buttons.

8. **Spacing Generosity:** Use larger padding (p-6, p-8) and margins (gap-8, space-y-8).

9. **Semantic Structure:** Use proper heading hierarchy (h1 > h2 > h3).

10. **Mobile-First:** Build layouts mobile-first with responsive grid columns.

---

## Common Patterns to Avoid

1. **Soft Shadows:** Never use `shadow-lg`, `shadow-md`. Use hard `brutalist-shadow` if needed.

2. **Rounded Corners:** Avoid `rounded-md`, `rounded-lg` on UI elements.

3. **Gradients on Backgrounds:** Only use gradients for mockup previews, not UI elements.

4. **Light Font Weights:** Never use `font-normal` or `font-light`.

5. **Subtle Borders:** Avoid `border` (1px). Use `border-4` or `border-8`.

6. **Muted Colors:** Avoid grays for primary text. Use black or white.

7. **Opacity for Layering:** Use solid colors instead of transparency.

8. **Animation Overuse:** Keep animations minimal - only translate/scale on hover.

9. **Inconsistent Border Widths:** Match border widths within sections.

10. **Rounded Buttons:** Keep buttons sharp-cornered.

---

## Future Enhancement Suggestions

- [ ] Create Space Mono font-face declaration in CSS for proper loading
- [ ] Add custom Tailwind config for brutalist-shadow utilities
- [ ] Create reusable `BrutalistCard`, `BrutalistButton` components
- [ ] Add print stylesheet maintaining brutalist aesthetic
- [ ] Document icon usage patterns (currently using inline SVGs)
- [ ] Add motion-reduced preference styles
- [ ] Create Storybook documentation for all components

---

## Testing Checklist

### Visual Testing
- [ ] Components render correctly with yellow-300 background
- [ ] Components render correctly with black background
- [ ] Text remains readable on all background colors
- [ ] Borders display at correct widths (4px, 8px)
- [ ] Hover states work on interactive elements
- [ ] Responsive breakpoints work (mobile, tablet, desktop)

### Accessibility Testing
- [ ] Color contrast meets WCAG AA (14.5:1 for primary)
- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible
- [ ] Screen reader announces content correctly
- [ ] Touch targets are minimum 44x44px on mobile

### Cross-Browser Testing
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile Safari
- [ ] Chrome Mobile

### Typography Testing
- [ ] Space Mono loads correctly (or fallback to system fonts)
- [ ] Font weights display correctly (700, 900)
- [ ] UPPERCASE transforms display properly
- [ ] Line heights work at all text sizes

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-31 | Initial brutalist style guide for FaviconForge |
