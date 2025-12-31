# FaviconForge - Mockups Brutalistas

## Descripción

Mockups de diseño brutalista para FaviconForge, una aplicación web para generar favicons en múltiples formatos.

## Páginas Creadas

1. **Landing Page** (`LandingPage.jsx` / incluida en `faviconforge-mockup.html`)
   - Hero section con propuesta de valor
   - Grid de features
   - Sección de pricing (Free vs Premium)
   - Footer

2. **Upload Page** (`UploadPage.jsx`)
   - Área de drag & drop para subir imagen
   - Validación de requisitos
   - Barra de progreso (Step 1/3)

3. **Preview Page** (`PreviewPage.jsx`)
   - Grid con 6 previews diferentes:
     - Browser Tab
     - iOS Home Screen
     - Android Home Screen
     - Windows Tile
     - Bookmark Bar
     - PWA Install
   - Barra de progreso (Step 2/3)

4. **Download Page** (`DownloadPage.jsx`)
   - Selección de tier (Free vs Premium)
   - Vista previa del contenido del ZIP
   - CTA para descargar
   - Barra de progreso (Step 3/3)

5. **Success Page** (`SuccessPage.jsx`)
   - Confirmación de pago exitoso
   - Pasos siguientes
   - Beneficios premium
   - Recibo de compra

## Características del Diseño Brutalista

### Paleta de Colores
- **Amarillo (#FDE047)**: Color principal de marca
- **Negro (#000000)**: Texto y bordes
- **Blanco (#FFFFFF)**: Fondos alternativos
- **Verde (#059669)**: Estados de éxito
- **Rojo (#DC2626)**: Tags premium y alertas

### Tipografía
- **Font Family**: Space Mono (monoespaciada)
- **Pesos**: Bold (700) y Black (900)
- **Uso intensivo de UPPERCASE** para títulos

### Elementos Visuales
- **Bordes**: 4px y 8px de grosor en negro
- **Sin sombras suaves**: Solo sombras duras (brutalist-shadow)
- **Sin gradientes en fondos**: Colores planos
- **Ángulos**: Rotaciones leves (1-3 grados) para dinamismo
- **Transiciones**: Hover states con translate y scale

### Layout
- **Asimétrico**: Uso de rotaciones y offsets
- **Grid System**: Tailwind responsive grid
- **Spacing**: Generoso uso de padding y gaps
- **Bordes gruesos**: Separadores visuales prominentes

## Archivos

- `faviconforge-mockup.html`: Versión interactiva con navegación entre páginas
- `LandingPage.jsx`: Componente React de landing
- `UploadPage.jsx`: Componente React de upload
- `PreviewPage.jsx`: Componente React de preview
- `DownloadPage.jsx`: Componente React de download
- `SuccessPage.jsx`: Componente React de success

## Uso del Mockup HTML

Abre `faviconforge-mockup.html` en tu navegador. Usa la barra de navegación en la parte inferior para cambiar entre páginas.

## Principios KISS Aplicados

1. **Código simple y directo**: Sin abstracciones innecesarias
2. **Tailwind inline**: Estilos claros y visibles
3. **Sin dependencias complejas**: Solo Tailwind CDN para el HTML
4. **Componentes autocontenidos**: Cada página es independiente
5. **HTML semántico**: Headers, sections, footers claros

## Próximos Pasos

1. Integrar componentes en React Router 7
2. Añadir funcionalidad de upload real
3. Implementar generación de favicons con Canvas API
4. Conectar con Better Auth para login
5. Integrar Stripe para pagos

## Notas Técnicas

- **Responsive**: Breakpoints de Tailwind (sm, md, lg)
- **Accesibilidad**: Uso semántico de HTML
- **Performance**: Inline styles, sin JS pesado en mockup
- **Compatibilidad**: Funciona en todos los navegadores modernos
