# BUGFIX: Premium Users Still See Blurred Previews on /preview

**Status:** ✅ Solved

## 1. Bug Description

### Current Behavior (Bug)

Cuando un usuario **logueado** ya es **premium** (Caso A) y navega a `/preview`, la grid completa de previews se renderiza, pero **todas las previews premium siguen viéndose con blur**.

- El usuario es premium (en DB)
- La página `/download` funciona (el botón permite descargar premium)
- El problema es **solo visual** en `/preview`

**Steps to reproduce:**
1. Login con un usuario que ya es premium
2. Ir al flujo normal: `/upload` -> subir imagen válida -> continuar a `/preview` (o entrar directo a `/preview` si hay imagen en IndexedDB)
3. Observar: las previews premium (iOS/Android/Windows/PWA) aparecen con blur

### Expected Behavior (After Fix)

1. Si el usuario logueado es premium, **toda la grid de previews debe ser visible (sin blur)**
2. Los badges “PREMIUM” pueden seguir apareciendo como etiqueta informativa, pero **no deben implicar blur** para usuarios premium
3. Para usuarios no-premium, las previews premium **siguen estando blurred** (gating visual)

## 2. Technical Analysis

### Conflicting Flow

- El route module `app/routes/preview.tsx` ya expone `user` desde el `loader`, pero ese dato **no se usa** para decidir el gating visual.
- En `app/components/preview/PreviewGrid.tsx` se calcula:

```ts
const isPremium = preview.tier === 'premium'
const isBlurred = isPremium
```

Esto hace que **toda preview con `tier: 'premium'` se blurree siempre**, independientemente del estado premium real del usuario.

### Root Cause

**OBVIOUS:** La lógica de blur está acoplada al `tier` del preview en `PreviewGrid`, sin consultar el estado premium del usuario.

## 3. Solution Plan

### `app/routes/preview.tsx`
**Objective:** Pasar a la UI el estado premium efectivo del usuario (derivado del `loader`).

**Pseudocode:**
```pseudocode
LOADER preview
  authSession = getCurrentUser(request)
  RETURN { user: authSession.user, session: authSession.session }

COMPONENT PreviewPage
  user = useLoaderData().user
  isUserPremium = user?.isPremium === true
  RENDER <PreviewGrid ... isUserPremium={isUserPremium} />
END
```

### `app/components/preview/PreviewGrid.tsx`
**Objective:** Aplicar blur solo si el preview es premium **y** el usuario NO es premium.

**Pseudocode:**
```pseudocode
COMPONENT PreviewGrid(props)
  INPUT: generationState, getFaviconUrl, isUserPremium

  FOR preview IN previews
    isPreviewPremium = preview.tier === 'premium'
    isBlurred = isPreviewPremium AND (isUserPremium IS FALSE)
    RENDER PreviewCard(isBlurred)
  END
END
```

### `app/components/preview/PreviewCard.tsx`
**Objective:** Mantener `PreviewCard` como presentacional. No debería decidir reglas de negocio.

**Pseudocode:**
```pseudocode
COMPONENT PreviewCard(props)
  INPUT: isBlurred
  APPLY className blur solo si isBlurred
END
```

## 4. Regression Tests (E2E Only)

### Test: Premium user sees all previews unblurred on /preview

**Archivo:** `tests/e2e/preview.spec.ts`

- **Preconditions:**
  - DB limpia
  - Se crea sesión autenticada (Better Auth helper)
  - A ese usuario se le concede premium vía `/api/__test__/premium`
  - Se sube una imagen válida en `/upload` para llegar a `/preview`
- **Steps:**
  1. Crear sesión con `createAuthSession` y setear cookie con `setAuthCookie`
  2. Llamar `POST /api/__test__/premium` con `{ userId, stripeCustomerId }`
  3. Ir a `/upload`, subir `valid-512x512.png`, click “Continue”
  4. Esperar navegación a `/preview`
  5. Verificar que **no existe blur** en las previews premium
- **Expected:**
  - Ninguna preview premium está blurred

### Test: Non-premium user still sees premium previews blurred

**Archivo:** `tests/e2e/preview.spec.ts` (ajustar test existente)

- **Preconditions:** Usuario normal (no premium)
- **Steps:** Ir a `/upload` -> `/preview` con imagen válida
- **Expected:** Las previews premium sí aparecen con blur

## 5. Definition of Done

1. **Bug fixed:** usuario premium ve previews sin blur en `/preview`
2. **No regression:** usuario no-premium sigue viendo blur en previews premium
3. **Tests pass:** `npm run test:e2e -- --retries=1`
4. `npm run typecheck` passes
5. `npm run lint` passes

## 6. Lessons Learned (Optional)

Si aplica, documentar en `docs/KNOWN_ISSUES.md` que el gating visual no debe basarse únicamente en metadatos de UI (`tier`), sino en el estado real del usuario derivado del server (`loader`).
