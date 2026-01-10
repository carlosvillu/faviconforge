# FEATURE_9.1_GA4Tracking

## 1. Natural Language Description

### Current state

- La app no ejecuta Google Analytics.
- No existe una forma de registrar eventos o page views.
- No hay banner de cookies ni control explícito de consentimiento.

### Expected end state

- La app muestra un **banner de cookies** al usuario (si no hay una preferencia guardada).
- GA4 (`gtag.js`) se carga **solo** cuando:
  - `GA_MEASUREMENT_ID` está presente, y
  - el usuario ha **aceptado** cookies/analytics.
- Existe un helper `trackEvent(name, params?)` para el resto del código.
- Se registran **page views** de forma consistente en navegación SPA.
- Hay tests mínimos que aseguran:
  - `trackEvent` no rompe en SSR / sin consentimiento / sin GA.
  - la persistencia de consentimiento funciona.

## 2. Technical Description

### High-level approach

- Añadir una capa de **consentimiento de cookies** (UI + persistencia) basada en cookie (mismo patrón que `lang` y `theme`).
- Exponer `GA_MEASUREMENT_ID` al cliente a través del `loader` de `app/root.tsx` (dato server->client), sin depender de `VITE_*`.
- Inyectar `gtag.js` **condicionalmente** en `app/root.tsx` (en `<head>`), pero de forma que el script solo se ejecute tras consentimiento.
- Implementar un helper cliente `app/lib/analytics.ts`:
  - No-op en SSR.
  - No-op si no hay consentimiento.
  - No-op si no hay measurement id.
  - Cuando esté activo, implementa:
    - `trackEvent(name, params?)`
    - `trackPageView(path, title?)` (interno)

### Page views: sugerencia

- Usar un enfoque de “auto pageview on navigation” en el root:
  - En un `useEffect` que observe el location actual (ruta + search).
  - Llamar a `trackPageView`.
- Motivo: evita que los route modules tengan que preocuparse por page views; reduce repetición y asegura consistencia.

### Cookie banner

- Implementar un componente presentacional `CookieBanner`.
- Implementar un hook `useCookieConsent` para:
  - leer estado inicial (desde cookie en `document.cookie`),
  - exponer acciones `accept` / `reject`,
  - persistir en cookie y cerrar el banner.

### Data flow

1. `root.loader` devuelve `gaMeasurementId` (si existe) además de `locale`, `session`, `user`, `themePreference`.
2. `App` compone `CookieBanner`.
3. Si el usuario acepta analytics:
   - se persiste la cookie
   - se inicializa GA (carga `gtag.js` + config)
4. A partir de ahí:
   - cambios de ruta disparan `page_view`
   - otros puntos del producto podrán llamar `trackEvent` (esto se amplía en 9.2)

## 2.1. Architecture Gate (REQUIRED)

- **Pages are puzzles:**
  - `app/root.tsx` solo compone providers + `Header`/`Outlet`/`Footer` + `CookieBanner`.
  - No se mete lógica de dominio dentro del JSX.
- **Loaders/actions are thin:**
  - `root.loader` solo expone datos (incluido `gaMeasurementId`) y no implementa reglas de analytics.
- **Business logic is not in components:**
  - La lógica de consentimiento y tracking se encapsula en:
    - `app/hooks/*` para orquestación React
    - `app/lib/*` para helpers puros/framework-agnostic

## 3. Files to Change/Create

### `app/root.tsx`

**Objective:**
- Exponer `gaMeasurementId` desde el loader.
- Componer el banner de cookies.
- Disparar page views en navegación (si analytics está habilitado por consentimiento).
- Cargar/inicializar `gtag.js` solo tras consentimiento.

**Pseudocode:**
```pseudocode
LOADER root
  READ process.env.GA_MEASUREMENT_ID
  RETURN loaderData including gaMeasurementId (nullable)
END

COMPONENT App
  READ loaderData.gaMeasurementId
  RENDER existing providers/layout
  RENDER CookieBanner (only when gaMeasurementId exists)

  ON navigation change
    CALL analytics.trackPageView(currentPath)
END
```

### `app/lib/analytics.ts`

**Objective:**
- Centralizar tracking GA4 con API pequeña.
- Evitar fallos en SSR.

**Pseudocode:**
```pseudocode
TYPE AnalyticsInit
  measurementId: string | null
  hasConsent: boolean
END

FUNCTION initAnalytics(config: AnalyticsInit)
  IF window is undefined -> return
  IF no measurementId -> return
  IF no consent -> return
  IF already initialized -> return
  INJECT script tag for gtag.js (async)
  SET window.dataLayer and window.gtag
  CALL gtag('js', new Date())
  CALL gtag('config', measurementId, { send_page_view: false })
END

FUNCTION trackEvent(name, params?)
  IF not initialized -> return
  CALL gtag('event', name, params)
END

FUNCTION trackPageView(path, title?)
  IF not initialized -> return
  CALL gtag('event', 'page_view', { page_path: path, page_title: title? })
END
```

### `app/lib/cookieConsent.ts`

**Objective:**
- Encapsular lectura/escritura de cookie de consentimiento.

**Pseudocode:**
```pseudocode
CONST COOKIE_NAME = 'cookie_consent'
CONST COOKIE_MAX_AGE = 365 days

TYPE ConsentState = 'accepted' | 'rejected' | 'unset'

FUNCTION readConsentFromCookie(cookieHeaderOrDocumentCookie: string | null): ConsentState
  PARSE cookies
  RETURN mapped state or 'unset'
END

FUNCTION createConsentCookie(value: 'accepted'|'rejected'): string
  RETURN Set-Cookie string with Path=/, Max-Age, SameSite=Lax
END
```

### `app/hooks/useCookieConsent.ts`

**Objective:**
- Orquestar consentimiento en el cliente.

**Pseudocode:**
```pseudocode
HOOK useCookieConsent
  STATE consent: ConsentState

  ON mount
    SET consent from document.cookie

  FUNCTION accept()
    document.cookie = createConsentCookie('accepted')
    set consent

  FUNCTION reject()
    document.cookie = createConsentCookie('rejected')
    set consent

  RETURN { consent, accept, reject, shouldShowBanner }
END
```

### `app/components/CookieBanner.tsx`

**Objective:**
- UI brutalista para pedir consentimiento.
- No contener lógica de cookies ni analytics.

**Pseudocode:**
```pseudocode
COMPONENT CookieBanner
  PROPS: onAccept, onReject, isOpen
  IF not isOpen -> return null
  RENDER banner with text + two buttons (Accept / Reject)
END
```

### `app/hooks/useAnalytics.ts`

**Objective:**
- Orquestar inicialización de GA4 cuando hay measurement id + consentimiento.

**Pseudocode:**
```pseudocode
HOOK useAnalytics
  INPUT: measurementId, consent
  EFFECT when measurementId/consent changes
    CALL initAnalytics({ measurementId, hasConsent: consent === 'accepted' })
  RETURN { trackEvent }
END
```

### `tests/unit/analytics.test.ts`

**Objective:**
- Tests mínimos para asegurar no-op y llamadas correctas en client.

**Pseudocode:**
```pseudocode
TEST trackEvent is no-op in SSR
TEST initAnalytics does nothing without measurementId
TEST initAnalytics does nothing without consent
TEST when initialized, trackEvent calls gtag('event', ...)
```

### `tests/unit/cookieConsent.test.ts`

**Objective:**
- Tests mínimos de parsing y serialización.

**Pseudocode:**
```pseudocode
TEST readConsentFromCookie returns unset when missing
TEST readConsentFromCookie returns accepted/rejected
TEST createConsentCookie contains Path=/ and SameSite=Lax
```

## 4. I18N

#### Existing keys to reuse
- (TBD) Buscar si existe algo tipo `accept`, `reject`, `close`, `privacy_policy`.

#### New keys to create
| Key | English | Spanish |
|-----|---------|---------|
| `cookie_banner_title` | Cookies & Analytics | Cookies y analítica |
| `cookie_banner_description` | We use cookies to understand usage and improve the product. | Usamos cookies para entender el uso y mejorar el producto. |
| `cookie_banner_accept` | Accept | Aceptar |
| `cookie_banner_reject` | Reject | Rechazar |

Notes:
- Mantener keys planas (`snake_case`).
- Añadirlas a `app/locales/en.json` y `app/locales/es.json`.

## 5. Test Plan (Unit + minimal E2E optional)

### Unit Test: analytics helper does not break without window
- **Preconditions:** entorno Vitest
- **Steps:** llamar `trackEvent` sin `window`
- **Expected result:** no lanza excepción

### Unit Test: analytics does not initialize without consent
- **Preconditions:** `window` disponible (jsdom)
- **Steps:** llamar `initAnalytics({ measurementId, hasConsent: false })`
- **Expected result:** no define `window.gtag`, no inserta script

### Unit Test: analytics calls gtag when initialized
- **Preconditions:** stub de `window.gtag`
- **Steps:** llamar `trackEvent('x')`
- **Expected result:** se llama `gtag('event', 'x', ...)`

### (Opcional) E2E Test: cookie banner is shown when GA is configured
- **Preconditions:** `GA_MEASUREMENT_ID` configurado en el server durante E2E
- **Steps:** abrir home
- **Expected result:** banner visible, aceptar lo cierra

## 6. Definition of Done (CRITICAL)

- `npm run test:unit` pasa (incluye tests nuevos).
- `npm run typecheck` pasa.
- `npm run lint` pasa.
- GA4 no se carga sin consentimiento.
- Con consentimiento + `GA_MEASUREMENT_ID`, se registran page views en navegación.
