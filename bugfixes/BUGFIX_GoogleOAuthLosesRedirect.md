# BUGFIX: Google OAuth Loses Redirect Query Parameter

**Status:** ✅ DONE  
**Created:** 2024-12-11

## 1. Bug Description

### Current Behavior (Bug)

Cuando un usuario anónimo intenta acceder a una ruta protegida (ej: `/dashboard`), es redirigido correctamente a `/auth/login?redirect=/dashboard`. Sin embargo, si hace login/signup con Google, el query parameter `redirect` se pierde y el usuario acaba en la Home (`/`) en lugar del dashboard.

**Steps to reproduce:**
1. Ir a `/dashboard` sin estar logueado
2. Ser redirigido a `/auth/login?redirect=%2Fdashboard`
3. Hacer clic en "Continuar con Google"
4. Completar el flujo OAuth de Google
5. **Observar:** El usuario acaba en `/` (Home) en lugar de `/dashboard`

**Nota:** El login con email/password SÍ funciona correctamente y respeta el redirect.

### Expected Behavior (After Fix)

Después del login/signup con Google, el usuario debe ser redirigido a la URL especificada en el query parameter `redirect`, igual que funciona con email/password.

## 2. Technical Analysis

### Conflicting Flow

1. Usuario anónimo va a `/dashboard`
2. `requireAuth()` en el loader detecta que no hay sesión
3. Redirige a `/auth/login?redirect=%2Fdashboard` ✅
4. Usuario hace clic en "Continuar con Google"
5. `GoogleAuthButton` llama a `signIn.social({ provider: 'google' })` **SIN `callbackURL`**
6. Better Auth usa el default `callbackURL: "/"` 
7. Después del OAuth, Better Auth redirige a `/` ❌
8. El query parameter `redirect` se pierde

### Root Cause

**OBVIO:** El componente `GoogleAuthButton` no lee el query parameter `redirect` de la URL actual ni lo pasa como `callbackURL` a `signIn.social()`.

Better Auth soporta el parámetro `callbackURL` en `signIn.social()`:
```typescript
await signIn.social({
  provider: 'google',
  callbackURL: '/dashboard', // ← Esto falta
})
```

**Comparación con email/password:**
- `auth.login.tsx` lee `searchParams.get('redirect')` y usa `navigate(redirectTo)` después del login ✅
- `GoogleAuthButton` no recibe ni usa el redirect ❌

## 3. Solution Plan

### `app/components/GoogleAuthButton.tsx`

**Objective:** Recibir el `callbackURL` como prop y pasarlo a `signIn.social()`.

**Pseudocode:**
```pseudocode
BEFORE:
  PROPS: mode, role
  
  handleClick:
    IF mode === 'signup'
      signIn.social({ provider: 'google', requestSignUp: true, additionalData: { role } })
    ELSE
      signIn.social({ provider: 'google' })

AFTER:
  PROPS: mode, role, callbackURL (optional, default: '/')
  
  handleClick:
    IF mode === 'signup'
      signIn.social({ 
        provider: 'google', 
        requestSignUp: true, 
        additionalData: { role },
        callbackURL  // NEW
      })
    ELSE
      signIn.social({ 
        provider: 'google',
        callbackURL  // NEW
      })
```

### `app/routes/auth.login.tsx`

**Objective:** Pasar el redirect URL al `GoogleAuthButton`.

**Pseudocode:**
```pseudocode
BEFORE:
  redirectTo = searchParams.get('redirect') || '/'
  // Solo usado en onSubmit para email/password
  
  <GoogleAuthButton mode="login" />

AFTER:
  redirectTo = searchParams.get('redirect') || '/'
  
  <GoogleAuthButton mode="login" callbackURL={redirectTo} />
```

### `app/routes/auth.signup.tsx`

**Objective:** Pasar el redirect URL al `GoogleAuthButton` (si existe).

**Pseudocode:**
```pseudocode
BEFORE:
  <GoogleAuthButton mode="signup" role={oauthRole} />

AFTER:
  redirectTo = searchParams.get('redirect') || '/'
  
  <GoogleAuthButton mode="signup" role={oauthRole} callbackURL={redirectTo} />
```

## 4. Regression Tests

**SKIPPED:** No se añaden tests E2E automatizados para este bugfix.

**Razón:** Como se documentó en `BUGFIX_GoogleLoginCreatesUser.md` y `docs/KNOWN_ISSUES.md`, los flujos OAuth con providers externos no son prácticos de testear en E2E automatizado.

**Testing manual requerido:**
1. Ir a `/dashboard` sin estar logueado → ser redirigido a `/auth/login?redirect=%2Fdashboard`
2. Hacer login con Google → debe acabar en `/dashboard` ✅
3. Repetir con signup: ir a `/auth/signup?redirect=/dashboard` → signup con Google → debe acabar en `/dashboard` ✅
4. Verificar que login/signup sin redirect sigue funcionando (acaba en `/`)

## 5. Files Summary

| File | Change |
|------|--------|
| `app/components/GoogleAuthButton.tsx` | Add `callbackURL` prop, pass to `signIn.social()` |
| `app/routes/auth.login.tsx` | Pass `redirectTo` to `GoogleAuthButton` |
| `app/routes/auth.signup.tsx` | Pass `redirectTo` to `GoogleAuthButton` |

**Estimated complexity:** Low (3 files, ~10 lines changed)
