# FEATURE_10.1_GoogleStyleManifest.md

## 1. Natural Language Description

### Current State
El manifest.json generado actualmente incluye solo 4 iconos para Android:
- `icon-192.png` (192x192)
- `icon-512.png` (512x512)
- `maskable-icon-192.png` (192x192, maskable)
- `maskable-icon-512.png` (512x512, maskable)

La carpeta `public/android/` contiene estos 4 archivos.

### Expected End State
El manifest.json generado seguirá el patrón de Google AI Studio con **6 tamaños de iconos maskable** que garantizan una visualización óptima en todos los dispositivos:
- 32x32
- 64x64
- 96x96
- 128x128
- 180x180
- 256x256

**Todos los iconos serán maskable** (con `purpose: "maskable"`), siguiendo el patrón de Google.

La carpeta `android/` del ZIP generado contendrá estos 6 nuevos tamaños. Los tamaños anteriores (192, 512) se eliminarán ya que no forman parte del nuevo estándar.

---

## 2. Technical Description

### High-Level Approach
1. **Actualizar constantes de tamaños**: Modificar `MASKABLE_SIZES` en `faviconGeneration.types.ts` para incluir los nuevos tamaños: `[32, 64, 96, 128, 180, 256]`
2. **Eliminar iconos no-maskable de Android**: Los iconos `icon-192.png` e `icon-512.png` ya no se generarán para Android
3. **Actualizar generación de manifest**: Modificar `generateManifest()` para generar la estructura de Google con los 6 tamaños maskable
4. **Actualizar generación de maskable icons**: Modificar `generateMaskableFormats()` para usar los nuevos tamaños
5. **Limpiar `PREMIUM_SIZES`**: Eliminar 192 y 512 de `PREMIUM_SIZES` ya que ahora solo se generan como maskable

### Architecture Decisions
- **Solo iconos maskable para Android/PWA**: Siguiendo el patrón de Google, todos los iconos del manifest serán maskable
- **Tamaños optimizados**: Los 6 tamaños cubren desde dispositivos pequeños (32px) hasta pantallas de alta densidad (256px)
- **Eliminación de redundancia**: No se generarán iconos duplicados (antes había icon-192 + maskable-icon-192)

### Dependencies
- No hay nuevas dependencias
- Se modifica el servicio existente `faviconGeneration.ts`

---

## 2.1. Architecture Gate

- **Pages are puzzles:** No se modifican route modules en esta feature
- **Loaders/actions are thin:** No aplica
- **Business logic is not in components:** La lógica de generación permanece en `app/services/faviconGeneration.ts`

---

## 3. Files to Change/Create

### `app/services/faviconGeneration.types.ts`
**Objective:** Actualizar las constantes de tamaños para reflejar el nuevo estándar Google-style

**Pseudocode:**
```pseudocode
// BEFORE:
PREMIUM_SIZES = [180, 192, 512, 150]
MASKABLE_SIZES = [192, 512]

// AFTER:
PREMIUM_SIZES = [180, 150]  // Solo iOS y Windows, Android se maneja via maskable
MASKABLE_SIZES = [32, 64, 96, 128, 180, 256]  // Nuevos tamaños estilo Google
```

---

### `app/services/faviconGeneration.ts`
**Objective:** Actualizar la generación de formatos PNG, maskable icons y manifest

**Pseudocode:**
```pseudocode
// FUNCTION generatePNGFormats
// BEFORE: sizeToFormat incluía 192 y 512 para android/
// AFTER: Eliminar 192 y 512 de sizeToFormat (ya no se generan iconos no-maskable para Android)

FUNCTION generatePNGFormats(imageData, isPremium)
  sizeToFormat = {
    16: { name: 'favicon-16x16.png', path: 'web/', tier: 'free' },
    32: { name: 'favicon-32x32.png', path: 'web/', tier: 'free' },
    48: { name: 'favicon-48x48.png', path: 'web/', tier: 'free' },
    180: { name: 'apple-touch-icon.png', path: 'ios/', tier: 'premium' },
    150: { name: 'mstile-150x150.png', path: 'windows/', tier: 'premium' },
  }
  // 192 y 512 eliminados - ahora solo se generan como maskable
END

// FUNCTION generateMaskableFormats
// BEFORE: Solo generaba 192 y 512
// AFTER: Genera los 6 tamaños estilo Google

FUNCTION generateMaskableFormats(imageData, backgroundColor)
  sizeToFormat = {
    32: { name: 'maskable-icon-32.png', path: 'android/' },
    64: { name: 'maskable-icon-64.png', path: 'android/' },
    96: { name: 'maskable-icon-96.png', path: 'android/' },
    128: { name: 'maskable-icon-128.png', path: 'android/' },
    180: { name: 'maskable-icon-180.png', path: 'android/' },
    256: { name: 'maskable-icon-256.png', path: 'android/' },
  }
  
  FOR EACH size IN MASKABLE_SIZES
    blob = generateMaskableIcon(imageData, size, backgroundColor)
    format = { name, blob, path, size, tier: 'premium' }
    ADD format TO results
  END
END

// FUNCTION generateManifest
// BEFORE: Generaba 4 iconos (2 normales + 2 maskable)
// AFTER: Genera 6 iconos maskable estilo Google

FUNCTION generateManifest(options)
  manifest = {
    name: options.name,
    short_name: options.shortName,
    start_url: "/",
    display: "standalone",
    theme_color: options.themeColor,
    background_color: options.backgroundColor,
    icons: [
      { src: "/android/maskable-icon-32.png", type: "image/png", sizes: "32x32", purpose: "maskable" },
      { src: "/android/maskable-icon-64.png", type: "image/png", sizes: "64x64", purpose: "maskable" },
      { src: "/android/maskable-icon-96.png", type: "image/png", sizes: "96x96", purpose: "maskable" },
      { src: "/android/maskable-icon-128.png", type: "image/png", sizes: "128x128", purpose: "maskable" },
      { src: "/android/maskable-icon-180.png", type: "image/png", sizes: "180x180", purpose: "maskable" },
      { src: "/android/maskable-icon-256.png", type: "image/png", sizes: "256x256", purpose: "maskable" },
    ]
  }
  RETURN JSON.stringify(manifest)
END
```

---

## 4. Unit Test Plan

Esta feature modifica un servicio client-side (`faviconGeneration.ts`), por lo que se usarán tests unitarios con Vitest.

### Test: generateManifest returns Google-style manifest with 6 maskable icons
- **Preconditions:** None
- **Steps:** 
  1. Call `generateManifest()` with default options
  2. Parse the returned JSON
- **Expected:** 
  - `icons` array has exactly 6 elements
  - All icons have `purpose: "maskable"`
  - Sizes are: 32x32, 64x64, 96x96, 128x128, 180x180, 256x256
  - All paths start with `/android/maskable-icon-`

### Test: MASKABLE_SIZES constant has correct values
- **Preconditions:** None
- **Steps:** Import `MASKABLE_SIZES` from types
- **Expected:** `MASKABLE_SIZES` equals `[32, 64, 96, 128, 180, 256]`

### Test: PREMIUM_SIZES no longer includes Android sizes
- **Preconditions:** None
- **Steps:** Import `PREMIUM_SIZES` from types
- **Expected:** `PREMIUM_SIZES` does NOT include 192 or 512

### Test: generatePNGFormats does not generate Android icons
- **Preconditions:** Valid image blob
- **Steps:** 
  1. Call `generatePNGFormats()` with isPremium=true
  2. Check paths of generated formats
- **Expected:** No format has path `android/`

### Test: generateMaskableFormats generates 6 sizes
- **Preconditions:** Valid image blob
- **Steps:** 
  1. Call `generateMaskableFormats()` with valid image and background color
  2. Count successful results
- **Expected:** 6 formats generated with sizes 32, 64, 96, 128, 180, 256

---

## 5. Definition of Done

1. **ALL relevant tests pass:**
   - `npm run test:unit` passes (faviconGeneration tests)
   - `npm run test:e2e -- --retries=1` passes (existing download tests still work)
2. `npm run typecheck` passes
3. `npm run lint` passes
4. Generated ZIP contains:
   - `android/maskable-icon-32.png`
   - `android/maskable-icon-64.png`
   - `android/maskable-icon-96.png`
   - `android/maskable-icon-128.png`
   - `android/maskable-icon-180.png`
   - `android/maskable-icon-256.png`
   - `manifest.json` with 6 maskable icons
5. No `android/icon-192.png` or `android/icon-512.png` in generated ZIP
