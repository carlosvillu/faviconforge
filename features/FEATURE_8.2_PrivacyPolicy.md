# FEATURE_8.2_PrivacyPolicy.md

## 1. Natural Language Description

### Current State (Before)
- El footer ya muestra un link a `Privacy Policy` (`/privacy`), pero la ruta no existe.
- Existe `/terms` implementado con contenido en Markdown (EN/ES) y estilos brutalist, pero su metadata (`title`/`description`) está hardcodeada en inglés.

### Expected End State (After)
- Existe una página `/privacy` que renderiza la Privacy Policy de FaviconForge.
- El contenido se carga desde archivos Markdown (`privacy.en.md` y `privacy.es.md`) colocados junto al route module (mismo patrón que `/terms`).
- La página detecta el idioma actual (cookie `lang` + `Accept-Language`) y muestra el contenido correspondiente.
- **La metadata SEO** (title/description) se obtiene vía **i18n keys**.
- Se actualiza también `/terms` para usar **i18n keys** para su metadata SEO.

### Acceptance Criteria
- [ ] Ruta `/privacy` accesible y renderiza correctamente
- [ ] Contenido se carga desde archivos Markdown (`privacy.en.md` / `privacy.es.md`)
- [ ] Cambia automáticamente según el idioma seleccionado
- [ ] Página sigue la estética brutalist existente (mismo layout que `/terms`: fondo `bg-yellow-300`, tarjeta con `border-8 border-black`, `prose-brutalist`)
- [ ] Metadata SEO para `/privacy` usa i18n keys (EN/ES)
- [ ] Metadata SEO para `/terms` usa i18n keys (EN/ES)
- [ ] El link del footer a `/privacy` funciona
- [ ] `npm run typecheck` pasa
- [ ] `npm run lint` pasa
- [ ] `npm run test:e2e -- --retries=1` pasa

---

## 2. Technical Description

### High-Level Approach
Reutilizar el patrón ya implementado en `app/routes/terms/`:
- Importar `.md` como string usando `?raw`
- Convertir Markdown a HTML con `marked`
- Renderizar el HTML con `dangerouslySetInnerHTML` dentro de `article.prose-brutalist`
- Detectar el locale desde el request con `parseLangCookie` + `detectLocale`

Para la metadata SEO:
- Crear claves i18n para `terms_meta_*` y `privacy_meta_*`.
- En cada loader (`/terms` y `/privacy`), construir un i18n instance SSR con `createI18nInstance(locale)` y resolver `t(...)` para `metaTitle` / `metaDescription`.
- La `meta` function debe leer esos campos desde `loaderData`.

### Dependencies
- No nuevas dependencias (ya existe `marked`).

### Data Flow
```
Request → loader
         ├─ locale = detectLocale(request, parseLangCookie(cookie))
         ├─ markdown = contentByLocale[locale]
         ├─ html = marked.parse(markdown)
         ├─ i18n = await createI18nInstance(locale)
         ├─ metaTitle = i18n.t('...')
         ├─ metaDescription = i18n.t('...')
         └─ return { content: html, locale, metaTitle, metaDescription }

meta({ data }) → uses data.metaTitle/data.metaDescription

component → render HTML with existing brutalist layout
```

---

## 2.1. Architecture Gate

- **Pages are puzzles:** Los route modules (`/terms`, `/privacy`) contienen UI mínima: solo layout + render del HTML procesado.
- **Loaders/actions are thin:** El loader solo:
  - Detecta `locale`
  - Selecciona markdown
  - Convierte a HTML
  - Calcula metadata por i18n
- **Business logic is not in components:** No hay reglas de dominio; el componente solo renderiza.

### Route Summary
| Route | Loader | Action | Components |
|------|--------|--------|------------|
| `/privacy` | Detecta idioma, carga MD, convierte a HTML, resuelve meta vía i18n | None | Renderiza HTML con estilos |
| `/terms` (update) | Igual, pero además expone meta vía i18n | None | Renderiza HTML con estilos |

---

## 3. Files to Change/Create

### `app/routes.ts`
**Objective:** Registrar la ruta `/privacy`.

**Pseudocode:**
```pseudocode
ADD route('privacy', 'routes/privacy/index.tsx')
```

---

### `app/routes/privacy/privacy.en.md`
**Objective:** Contenido de Privacy Policy en inglés (placeholder inicial). Debe cubrir:
- Qué datos se recolectan
- Cookies (incl. `lang`)
- Autenticación (Google)
- Pagos (Stripe)
- Emails (Resend) / contacto
- Analítica (si aplica en el futuro)
- Retención de datos
- Derechos del usuario
- Contacto

**Pseudocode:**
```pseudocode
WRITE markdown sections with headings (h1/h2), lists where relevant
KEEP language neutral, no legal over-promises
```

---

### `app/routes/privacy/privacy.es.md`
**Objective:** Contenido de Privacy Policy en español (placeholder inicial), equivalente a EN.

**Pseudocode:**
```pseudocode
TRANSLATE/enforce same structure as EN
```

---

### `app/routes/privacy/index.tsx`
**Objective:** Route module para `/privacy` que:
- Carga markdown EN/ES
- Convierte a HTML con `marked`
- Calcula meta SEO con i18n
- Renderiza con el mismo layout brutalist que `/terms`

**Pseudocode:**
```pseudocode
IMPORT LoaderFunctionArgs, MetaFunction, useLoaderData
IMPORT { marked }
IMPORT { detectLocale, parseLangCookie, createI18nInstance }
IMPORT privacyEn FROM './privacy.en.md?raw'
IMPORT privacyEs FROM './privacy.es.md?raw'

CONST markdownContent = { en: privacyEn, es: privacyEs }

FUNCTION loader({ request })
  cookieHeader = request.headers.get('Cookie')
  langCookie = parseLangCookie(cookieHeader)
  locale = detectLocale(request, langCookie)

  markdown = markdownContent[locale]
  html = await marked.parse(markdown)

  i18n = await createI18nInstance(locale)
  metaTitle = i18n.t('privacy_meta_title')
  metaDescription = i18n.t('privacy_meta_description')

  RETURN { content: html, locale, metaTitle, metaDescription }
END

FUNCTION meta({ data })
  RETURN [
    { title: data?.metaTitle ?? 'Privacy Policy - FaviconForge' },
    { name: 'description', content: data?.metaDescription ?? '' }
  ]
END

COMPONENT PrivacyPage
  data = useLoaderData()
  RENDER same layout as TermsPage
    main.bg-yellow-300.min-h-screen.py-16
      container max-w-4xl mx-auto px-6
        card border-8 border-black bg-white p-8 md:p-12
          article.prose-brutalist dangerouslySetInnerHTML(content)
END
```

---

### `app/routes/terms/index.tsx`
**Objective:** Actualizar `/terms` para que su `meta` use i18n keys (sin tocar el contenido principal, layout, ni el patrón de markdown).

**Pseudocode:**
```pseudocode
IMPORT createI18nInstance from ~/lib/i18n

IN loader:
  i18n = await createI18nInstance(locale)
  metaTitle = i18n.t('terms_meta_title')
  metaDescription = i18n.t('terms_meta_description')
  RETURN { content, locale, metaTitle, metaDescription }

IN meta({ data }):
  title = data?.metaTitle ?? fallback
  description = data?.metaDescription ?? fallback
```

---

### `app/locales/en.json`
**Objective:** Añadir claves nuevas para metadata SEO.

**Pseudocode:**
```pseudocode
ADD keys:
  terms_meta_title
  terms_meta_description
  privacy_meta_title
  privacy_meta_description
```

---

### `app/locales/es.json`
**Objective:** Añadir traducciones de las claves nuevas.

**Pseudocode:**
```pseudocode
ADD same keys with Spanish strings
```

---

## 4. I18N

#### Existing keys to reuse
- `landing_footer_privacy` (solo UI del footer; no aplica a meta)
- `landing_footer_terms`

#### New keys to create
| Key | English | Spanish |
|-----|---------|---------|
| `terms_meta_title` | Terms of Service - FaviconForge | Términos de Servicio - FaviconForge |
| `terms_meta_description` | Terms of Service for FaviconForge favicon generator | Términos de Servicio para el generador de favicons FaviconForge |
| `privacy_meta_title` | Privacy Policy - FaviconForge | Política de Privacidad - FaviconForge |
| `privacy_meta_description` | Privacy Policy for the FaviconForge favicon generator | Política de Privacidad para el generador de favicons FaviconForge |

---

## 5. E2E Test Plan

### Test: Privacy Policy page loads correctly
**File:** `tests/e2e/privacy.spec.ts`

- **Preconditions:** None (anonymous access)
- **Steps:**
  1. Navigate to `/privacy`
  2. Verify main heading (h1) contains "Privacy Policy" (EN default)
  3. Verify at least a few section headings (h2) are visible
- **Expected:** Page loads with privacy content from Markdown

### Test: Privacy page shows content in selected language
- **Preconditions:** Set cookie `lang=es`
- **Steps:**
  1. Set cookie `lang=es`
  2. Navigate to `/privacy`
  3. Verify heading contains "Política de Privacidad" (or equivalent Spanish heading)
- **Expected:** Spanish content is displayed

### Test: Privacy page is accessible from footer
- **Preconditions:** On home page
- **Steps:**
  1. Navigate to `/`
  2. Scroll to footer
  3. Click "Privacy Policy" link
- **Expected:** Navigates to `/privacy`

### Test: Terms meta is localized (smoke)
- **Preconditions:** None
- **Steps:**
  1. Navigate to `/terms`
  2. (Optional) Assert document title matches EN i18n string
  3. Set cookie `lang=es` and navigate again
- **Expected:** Title/description reflect i18n keys

Notes:
- Mantener tests simples y robustos (no depender de copy muy específico del cuerpo legal, solo headings principales).

---

## 6. Definition of Done

1. **ALL relevant tests pass:**
   - `npm run test:e2e -- --retries=1`
2. `npm run typecheck` passes
3. `npm run lint` passes
4. All acceptance criteria from section 1 are met
