# BUGFIX: Google Login Creates User Instead of Failing

**Status:** ✅ RESOLVED  
**Resolved:** 2024-12-10

## 1. Bug Description

### Current Behavior (Bug)

El botón "Continuar con Google" en la página de Login (`/auth/login`) crea automáticamente una cuenta nueva si el usuario no existe en la plataforma, en lugar de devolver un error.

**Steps to reproduce:**
1. Ir a `/auth/login` (sin estar logueado)
2. Hacer clic en "Continuar con Google"
3. Seleccionar una cuenta de Google que NO esté registrada en la plataforma
4. Observar: Se crea una cuenta nueva con rol `listener` (default) y se hace login automático

**Consecuencia:** El usuario no puede elegir su rol (podcaster/listener) porque el signup implícito siempre asigna `listener` por defecto.

### Expected Behavior (After Fix)

- **Login con Google:** Si el usuario NO existe → mostrar error "No existe una cuenta con este email. Por favor, regístrate primero."
- **Signup con Google:** Si el usuario NO existe → crear cuenta con el rol seleccionado (comportamiento actual correcto)
- **Login con Google:** Si el usuario SÍ existe → hacer login (comportamiento actual correcto)

## 2. Technical Analysis

### Conflicting Flow

1. Usuario hace clic en "Continuar con Google" en `/auth/login`
2. `GoogleAuthButton` llama a `signIn.social({ provider: 'google' })` (sin `requestSignUp`)
3. Better Auth redirige a Google OAuth
4. Google devuelve el token al callback de Better Auth
5. Better Auth busca el usuario en la BBDD
6. **Si no existe:** Better Auth CREA el usuario automáticamente (implicit signup)
7. Se crea sesión y se redirige al home

### Root Cause

**OBVIO:** Better Auth tiene habilitado el "implicit signup" por defecto en OAuth. Esto significa que `signIn.social()` crea usuarios nuevos si no existen.

La solución está documentada en Better Auth:
- Opción `disableImplicitSignUp: true` en la configuración del social provider
- Cuando está activa, `signIn.social()` falla si el usuario no existe
- Para crear usuarios, se debe llamar con `requestSignUp: true` en el cliente

**Referencia:** https://www.better-auth.com/docs/concepts/oauth#disableimplicitsignup

## 3. Solution Plan

### `app/lib/auth.ts`

**Objective:** Deshabilitar el signup implícito en Google OAuth para que el login falle si el usuario no existe.

**Pseudocode:**
```pseudocode
BEFORE:
  socialProviders.google = {
    clientId: ...,
    clientSecret: ...
  }

AFTER:
  socialProviders.google = {
    clientId: ...,
    clientSecret: ...,
    disableImplicitSignUp: true  // NEW: Prevent auto-signup on login
  }
```

### `app/components/GoogleAuthButton.tsx`

**Objective:** Diferenciar el comportamiento entre login y signup. En signup, pasar `requestSignUp: true` para permitir la creación de usuarios.

**Pseudocode:**
```pseudocode
BEFORE:
  IF mode === 'signup' AND role
    signIn.social({ provider: 'google', additionalData: { role } })
  ELSE
    signIn.social({ provider: 'google' })

AFTER:
  IF mode === 'signup'
    // Signup: allow user creation with role
    signIn.social({ 
      provider: 'google', 
      requestSignUp: true,  // NEW: Enable user creation
      additionalData: { role } 
    })
  ELSE
    // Login: only existing users
    signIn.social({ provider: 'google' })
    // If user doesn't exist, Better Auth will return error
```

### `app/routes/auth.login.tsx`

**Objective:** Capturar y mostrar el error cuando el usuario intenta hacer login con Google pero no existe.

**Pseudocode:**
```pseudocode
BEFORE:
  GoogleAuthButton mode="login"
  // No error handling for OAuth

AFTER:
  GoogleAuthButton mode="login" onError={handleOAuthError}
  
  FUNCTION handleOAuthError(error)
    IF error.code === 'USER_NOT_FOUND' OR similar
      setError("No existe una cuenta con este email. Por favor, regístrate primero.")
```

**Nota:** Necesitamos investigar cómo Better Auth comunica el error de "usuario no encontrado" al cliente. Puede ser:
- Via query param en redirect (`?error=...`)
- Via callback en el cliente
- Via estado en la sesión

### Investigación adicional necesaria

Antes de implementar el manejo de errores en `auth.login.tsx`, verificar:
1. ¿Cómo devuelve Better Auth el error cuando `disableImplicitSignUp: true` y el usuario no existe?
2. ¿Se puede capturar en el cliente o hay que leer query params después del redirect?

## 4. Regression Tests

**SKIPPED:** No se añaden tests E2E para este bugfix.

**Razón:** Simular el flujo completo de Google OAuth en tests automatizados no aporta valor suficiente para la complejidad que requiere. Los tests de OAuth con providers externos son inherentemente frágiles y difíciles de mantener.

**Testing manual:** El fix se verificará manualmente probando:
1. Login con Google (cuenta no existente) → debe fallar
2. Signup con Google (cuenta no existente) → debe crear usuario con rol correcto
3. Login con Google (cuenta existente) → debe funcionar

**Documentado en:** `docs/KNOWN_ISSUES.md` - sección "OAuth Testing Limitations"

## 5. Implementation Notes

- El fix principal es de **1 línea** en `auth.ts` (`disableImplicitSignUp: true`)
- El cambio en `GoogleAuthButton.tsx` es de **1 línea** (`requestSignUp: true`)
- El manejo de errores en `auth.login.tsx` requiere investigación adicional sobre cómo Better Auth comunica el error

## 6. Applied Solution

La solución propuesta fue correcta, con un ajuste adicional:

### Cambio adicional: `onAPIError.errorURL`

Better Auth redirige errores de OAuth a `/api/auth/error` por defecto, mostrando su propia página de error. Para redirigir a nuestra página de login con el query param de error:

```pseudocode
// auth.ts
onAPIError: {
  errorURL: '/auth/login'  // Redirect OAuth errors to login page
}
```

Esto permite que `auth.login.tsx` capture el error via `?error=signup_disabled` y muestre el mensaje apropiado.
