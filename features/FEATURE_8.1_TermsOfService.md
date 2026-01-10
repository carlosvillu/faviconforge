# FEATURE_8.1_TermsOfService.md

## 1. Natural Language Description

### Current State (Before)
No hay página de Terms of Service en la aplicación. Los usuarios no tienen acceso a los términos legales del servicio. El footer menciona "Terms of Service" pero el link no existe.

### Expected End State (After)
Existe una página `/terms` con los Terms of Service de FaviconForge. El contenido legal se carga desde archivos Markdown (`terms.en.md` y `terms.es.md`) que están junto al archivo de la ruta. La página detecta el idioma seleccionado y muestra el contenido correspondiente. El estilo es brutalist y consistente con el resto del sitio.

### Acceptance Criteria
- [ ] Ruta `/terms` accesible y renderiza correctamente
- [ ] Contenido se carga desde archivos Markdown (terms.en.md / terms.es.md)
- [ ] Cambia automáticamente según el idioma seleccionado
- [ ] Página sigue la estética brutalist (bordes gruesos, tipografía bold, colores amarillo/negro)
- [ ] Markdown se renderiza con estilos apropiados (headings, párrafos, listas)
- [ ] `npm run typecheck` pasa
- [ ] `npm run lint` pasa

---

## 2. Technical Description

### High-Level Approach
La página carga contenido legal desde archivos Markdown externos. El loader detecta el idioma actual del usuario y pasa el contenido HTML convertido al componente. Esto permite editar el contenido legal sin tocar código.

### Architecture
- **Route folder**: `app/routes/terms/` - carpeta dedicada para la página de términos
  - `index.tsx` - loader detecta idioma, lee MD, convierte a HTML
  - `terms.en.md` - contenido legal en inglés
  - `terms.es.md` - contenido legal en español
- **No services needed**: la conversión MD→HTML ocurre en el loader
- **No hooks needed**: sin estado client-side, contenido estático desde loader

### Folder Structure
```
app/routes/terms/
├── index.tsx       # Route module
├── terms.en.md     # English content
└── terms.es.md     # Spanish content
```

### Dependencies
- `marked` - Para convertir Markdown a HTML en el servidor

### Data Flow
```
Request → Loader
           ├─ detectLocale(request) → 'en' | 'es'
           ├─ import terms.{locale}.md
           ├─ marked.parse(markdown) → HTML string
           └─ return { content: HTML, locale }
                     ↓
         Component renders HTML
```

---

## 2.1. Architecture Gate

- **Pages are puzzles:** El route module compone header + contenido renderizado, sin lógica de negocio.
- **Loaders/actions are thin:** Loader solo detecta idioma, lee archivo y convierte MD. Sin lógica de dominio.
- **Business logic is not in components:** No hay lógica de negocio, solo renderizado de HTML pre-procesado.

### Route Summary
| Route | Loader | Action | Components |
|-------|--------|--------|------------|
| `/terms` | Detecta idioma, carga MD, convierte a HTML | None | Renderiza HTML con estilos |

---

## 3. Files to Change/Create

### `package.json`
**Objective:** Añadir dependencia `marked` para parsear Markdown.

**Pseudocode:**
```pseudocode
ADD dependency "marked" to dependencies
RUN npm install marked
```

---

### `app/routes.ts`
**Objective:** Registrar la ruta `/terms` en la configuración de rutas.

**Pseudocode:**
```pseudocode
ADD route('terms', 'routes/terms/index.tsx')
```

---

### `app/routes/terms/terms.en.md`
**Objective:** Contenido de Terms of Service en inglés.

**Content structure:**
```markdown
# Terms of Service

**Last updated: January 2025**

## 1. Acceptance of Terms
By accessing and using FaviconForge...

## 2. Description of Service
FaviconForge is a web application...

## 3. Free and Premium Tiers
...

## 4. User Obligations
...

## 5. Payment and Refunds
...

## 6. Intellectual Property
...

## 7. Privacy
...

## 8. Limitation of Liability
...

## 9. Modifications to Terms
...

## 10. Contact
...
```

---

### `app/routes/terms/terms.es.md`
**Objective:** Contenido de Terms of Service en español.

**Content structure:**
```markdown
# Términos de Servicio

**Última actualización: Enero 2025**

## 1. Aceptación de los Términos
Al acceder y usar FaviconForge...

## 2. Descripción del Servicio
...

(Same structure, Spanish content)
```

---

### `app/routes/terms/index.tsx`
**Objective:** Página de Terms of Service que carga contenido desde archivos Markdown según el idioma.

**Pseudocode:**
```pseudocode
IMPORT { marked } FROM 'marked'
IMPORT { detectLocale, parseLangCookie } FROM '~/lib/i18n'

// Static imports of markdown files from same folder (Vite handles ?raw)
IMPORT termsEn FROM './terms.en.md?raw'
IMPORT termsEs FROM './terms.es.md?raw'

CONST markdownContent = {
  en: termsEn,
  es: termsEs
}

FUNCTION meta
  RETURN [
    { title: 'Terms of Service - FaviconForge' },
    { name: 'description', content: 'Terms of Service for FaviconForge' }
  ]
END

FUNCTION loader({ request })
  // Detect locale from cookie or Accept-Language header
  cookieHeader = request.headers.get('Cookie')
  langCookie = parseLangCookie(cookieHeader)
  locale = detectLocale(request, langCookie)

  // Get markdown content for locale
  markdown = markdownContent[locale]

  // Convert to HTML
  html = marked.parse(markdown)

  RETURN { content: html, locale }
END

COMPONENT TermsPage({ loaderData })
  const { content } = loaderData

  RENDER main container
    // Hero section with page title
    <header className="bg-yellow-300 py-16">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <!-- Title comes from the MD file as h1 -->
      </div>
    </header>

    // Content section
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-6">
        <article
          className="prose-brutalist"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </section>
  END RENDER
END COMPONENT
```

**CSS class `prose-brutalist` for markdown styling:**
```css
/* In app.css or inline styles */
.prose-brutalist h1 {
  @apply text-4xl md:text-6xl font-black uppercase mb-8 border-b-8 border-black pb-4;
}
.prose-brutalist h2 {
  @apply text-2xl font-black uppercase mt-12 mb-4 border-b-4 border-black pb-2;
}
.prose-brutalist p {
  @apply font-bold text-lg mb-4 leading-relaxed;
}
.prose-brutalist strong {
  @apply font-black;
}
.prose-brutalist ul, .prose-brutalist ol {
  @apply font-bold text-lg mb-4 pl-6;
}
.prose-brutalist li {
  @apply mb-2;
}
.prose-brutalist a {
  @apply underline text-black hover:text-yellow-600;
}
```

---

### `app/app.css`
**Objective:** Añadir estilos para renderizar Markdown con estética brutalist.

**Pseudocode:**
```pseudocode
ADD .prose-brutalist styles:
  - h1: large uppercase, thick bottom border
  - h2: medium uppercase, thin bottom border
  - p: bold text, good line height
  - strong: extra bold
  - ul/ol: bold, proper spacing
  - li: proper margin
  - a: underlined, black color
```

---

## 4. I18N Section

### Existing Keys to Reuse
- Ninguna específica para esta página

### New Keys to Create

| Key | English | Spanish |
|-----|---------|---------|
| `terms_meta_title` | Terms of Service - FaviconForge | Términos de Servicio - FaviconForge |
| `terms_meta_description` | Terms of Service for FaviconForge favicon generator | Términos de Servicio para el generador de favicons FaviconForge |

**Note:** El contenido principal viene de los archivos `.md`, no de i18n. Solo se necesitan claves para metadata SEO si se quiere traducir el title/description.

---

## 5. E2E Test Plan

### Test: Terms of Service page loads correctly

**File:** `tests/e2e/terms.spec.ts`

- **Preconditions:** None (anonymous access)
- **Steps:**
  1. Navigate to `/terms`
  2. Verify page title contains "Terms of Service"
  3. Verify main heading (h1) contains "Terms of Service"
  4. Verify at least 5 section headings (h2) are visible
- **Expected:** Page loads with terms content from Markdown

### Test: Terms page shows content in selected language

- **Preconditions:** Set language cookie to 'es'
- **Steps:**
  1. Set cookie `lang=es`
  2. Navigate to `/terms`
  3. Verify heading contains "Términos de Servicio"
- **Expected:** Spanish content is displayed

### Test: Terms page is accessible from footer

- **Preconditions:** On home page
- **Steps:**
  1. Navigate to `/`
  2. Scroll to footer
  3. Click "Terms of Service" link
- **Expected:** Navigates to `/terms`

---

## 6. Definition of Done

1. **ALL relevant tests pass:**
   - `npm run test:e2e -- --retries=1` passes
2. `npm run typecheck` passes
3. `npm run lint` passes
4. All acceptance criteria from section 1 are met
5. Markdown content renders with brutalist styling
6. Language switching works correctly

---

## Notes

- Estructura de carpeta: `app/routes/terms/` agrupa todos los archivos relacionados
- Los archivos `.md` están junto a `index.tsx` para fácil mantenimiento
- Se usa `?raw` import de Vite para cargar el contenido como string
- El contenido es placeholder legal genérico - el usuario puede editarlo directamente en los `.md`
- Este patrón se reutilizará para Privacy Policy (Task 8.2): `app/routes/privacy/{index.tsx, privacy.en.md, privacy.es.md}`
- El loader detecta idioma de la misma forma que root.tsx (cookie → Accept-Language → default)
