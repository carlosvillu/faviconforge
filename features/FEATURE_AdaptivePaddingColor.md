# FEATURE: Adaptive Padding Color from Border

## 1. Natural Language Description

### Current State
Actualmente, cuando se generan maskable icons para Android/PWA, el padding se rellena con el color `backgroundColor` que el usuario configura en el ManifestCustomizer (por defecto blanco `#ffffff`). Este mismo color se usa también para el campo `background_color` del manifest.json (splash screen de la PWA).

El problema es que el usuario tiene que elegir manualmente un color que coincida con el borde de su imagen para que el padding se vea homogéneo. Esto es tedioso y propenso a errores.

**Nota:** El `backgroundColor` del manifest se usa para el splash screen de la PWA y debe permanecer configurable por el usuario. Es independiente del color de padding de las imágenes.

### Expected End State
El sistema detectará automáticamente el color predominante del borde exterior (1 píxel) de la imagen subida y usará ese color para el padding de los maskable icons. Esto creará una transición visual homogénea entre la imagen y el padding.

El `backgroundColor` del manifest permanece sin cambios y sigue siendo configurable para el splash screen.

### Acceptance Criteria
1. El padding de los maskable icons usa el color predominante del borde de la imagen (NO el backgroundColor del manifest)
2. Se analiza solo el borde exterior de 1 píxel de la imagen
3. El color predominante se determina por frecuencia (el color que más se repite)
4. Los píxeles transparentes se ignoran en el análisis
5. Si todos los píxeles del borde son transparentes, se usa blanco (`#ffffff`) como fallback
6. El `backgroundColor` del manifest y su color picker permanecen sin cambios

---

## 2. Technical Description

### High-Level Approach
1. Crear una función `extractDominantBorderColor(imageData: Blob): Promise<string>` en el servicio de generación de favicons
2. Esta función:
   - Carga la imagen en un canvas
   - Extrae los píxeles del borde exterior (1px en cada lado)
   - Cuenta la frecuencia de cada color (ignorando transparentes)
   - Retorna el color más frecuente en formato hex, o `#ffffff` si no hay píxeles opacos
3. Integrar esta función en `generateAllFormats()` para obtener el color del padding antes de generar los maskable icons
4. El `backgroundColor` del manifest permanece independiente y se sigue usando para el manifest.json

### Dependencies
- Canvas 2D API (ya en uso)
- No requiere librerías externas

### Considerations
- La extracción del color debe hacerse una sola vez por imagen, no por cada tamaño de maskable icon
- El color se calcula en el cliente (navegador) ya que toda la generación es client-side
- Para imágenes con bordes muy variados (gradientes), se tomará el color que más veces aparece exacto
- El color extraído del borde se usa SOLO para el padding de maskable icons, NO para el manifest

---

## 2.1. Architecture Gate

- **Pages are puzzles:** No se modifican route modules. Los cambios son solo en servicios.
- **Loaders/actions are thin:** N/A - no hay cambios en loaders/actions.
- **Business logic is not in components:**
  - La lógica de extracción de color está en `app/services/faviconGeneration.ts` (servicio)
  - No hay cambios en componentes

### File responsibilities after changes:
- **`app/services/faviconGeneration.ts`**: Contiene la nueva función `extractDominantBorderColor()` y la integración con `generateAllFormats()`
- **`app/services/faviconGeneration.types.ts`**: Sin cambios (mantiene backgroundColor para el manifest)
- **`app/components/download/ManifestCustomizer.tsx`**: Sin cambios (mantiene el color picker de backgroundColor)

---

## 3. Files to Change/Create

### `app/services/faviconGeneration.ts`

**Objective:** Añadir función para extraer el color predominante del borde y usarlo automáticamente en la generación de maskable icons. El backgroundColor del manifest permanece sin cambios para el splash screen.

**Pseudocode:**

```pseudocode
// Nueva función auxiliar (no exportada)
FUNCTION rgbToHex(r: number, g: number, b: number): string
  RETURN '#' + r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0')
END

// Nueva función de utilidad (exportada para tests)
FUNCTION extractDominantBorderColor(imageData: Blob): Promise<string>
  INPUT: imageData (Blob de la imagen)

  PROCESS:
    1. Cargar imagen usando loadImage(imageData)
    2. Crear canvas temporal del tamaño de la imagen
    3. Dibujar imagen en canvas
    4. Obtener ImageData del canvas con ctx.getImageData(0, 0, width, height)
    5. Crear Map<string, number> para contar frecuencias
    6. Extraer píxeles del borde (1px):
       - Top row: y=0, x=0 to width-1
       - Bottom row: y=height-1, x=0 to width-1
       - Left column: x=0, y=1 to height-2 (esquinas ya contadas)
       - Right column: x=width-1, y=1 to height-2 (esquinas ya contadas)
    7. Para cada píxel del borde:
       - Calcular índice: (y * width + x) * 4
       - Leer r = data[i], g = data[i+1], b = data[i+2], a = data[i+3]
       - Si alpha < 128, ignorar (transparente)
       - Si alpha >= 128, hex = rgbToHex(r, g, b), incrementar conteo en Map
    8. Encontrar el color con mayor count en el Map
    9. Si Map está vacío (todo transparente), retornar '#ffffff'

  OUTPUT: string (hex color, e.g., '#ff5733')
END

// Modificar generateAllFormats (líneas 367-378 aproximadamente)
FUNCTION generateAllFormats(options)
  // ... código existente sin cambios ...

  // Generate maskable formats (premium only)
  IF isPremium THEN
    // CAMBIO: En lugar de usar manifestOptions.backgroundColor,
    // extraer el color del borde de la imagen
    paddingColor = await extractDominantBorderColor(imageData)
    maskableResults = await generateMaskableFormats(imageData, paddingColor)
    // ... resto igual ...
  END

  // El manifest sigue usando manifestOptions.backgroundColor
  // para el campo background_color (splash screen) - SIN CAMBIOS
  manifest = isPremium ? generateManifest(manifestOptions || DEFAULT_MANIFEST_OPTIONS) : null
END
```

**Additional notes:**
- La función `extractDominantBorderColor` se exporta para poder ser testeada unitariamente
- Se usa un Map<string, number> para contar frecuencias de colores
- El `backgroundColor` del manifest se sigue pasando a `generateManifest()` sin cambios

---

## 4. Unit Test Plan

Los tests existentes en `tests/unit/faviconGeneration.test.ts` deben actualizarse y añadirse nuevos.

### Test: extractDominantBorderColor returns most frequent border color
- **Preconditions:** Mock de canvas con imagen de borde de color sólido rojo
- **Steps:** Llamar a `extractDominantBorderColor(redBorderBlob)`
- **Expected:** Retorna `#ff0000`

### Test: extractDominantBorderColor ignores transparent pixels
- **Preconditions:** Mock de canvas con imagen donde el borde tiene píxeles transparentes y algunos azules
- **Steps:** Llamar a `extractDominantBorderColor(mixedBlob)`
- **Expected:** Retorna el color azul (ignora transparentes)

### Test: extractDominantBorderColor returns white fallback when all border pixels are transparent
- **Preconditions:** Mock de canvas con imagen de borde 100% transparente
- **Steps:** Llamar a `extractDominantBorderColor(transparentBorderBlob)`
- **Expected:** Retorna `#ffffff`

### Test: extractDominantBorderColor handles multi-color border (picks most frequent)
- **Preconditions:** Mock de imagen con borde: 60% rojo, 40% azul
- **Steps:** Llamar a `extractDominantBorderColor(multiColorBlob)`
- **Expected:** Retorna el color rojo (más frecuente)

### Test: generateAllFormats uses extracted border color for maskable icons (integration)
- **Preconditions:** Imagen con borde verde, usuario premium
- **Steps:** Llamar a `generateAllFormats()` con la imagen
- **Expected:** El `fillStyle` usado para maskable icons es el color verde del borde, NO el backgroundColor del manifest

---

## 5. Definition of Done

1. **ALL tests pass:**
   - `npm run test:unit` - todos los tests de faviconGeneration pasan
2. `npm run typecheck` passes
3. `npm run lint` passes
4. Los maskable icons generados usan el color del borde de la imagen original
5. El ManifestCustomizer sigue mostrando el color picker de backgroundColor (para el splash screen)
6. El manifest.json sigue usando backgroundColor para el campo background_color
7. Si la imagen tiene borde transparente, se usa blanco como fallback para el padding
