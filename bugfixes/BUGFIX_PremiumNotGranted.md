# BUGFIX: Premium Status Not Granted After Stripe Payment

## 1. Bug Description

### Current Behavior (Bug)

Cuando un usuario logeado completa el pago premium a través de Stripe:

1. Usuario en `/download` hace clic en "Buy Premium"
2. Se redirige a Stripe y completa el pago exitosamente
3. Stripe redirige a `/success`
4. Después de 3 segundos, se redirige a `/download?autoDownload=true`
5. **BUG:** La card premium NO está pre-seleccionada
6. **BUG:** El botón sigue mostrando "Pay 5€" en lugar de permitir descarga premium
7. **BUG:** El usuario NO está marcado como premium en la base de datos

**Steps to reproduce:**
1. Login como usuario sin premium
2. Ir a `/download`
3. Seleccionar la card "Premium"
4. Click en "Pay 5€"
5. Completar el pago en Stripe (usar tarjeta de test 4242 4242 4242 4242)
6. Esperar la redirección automática a `/download`
7. Observar: La card "Free" está seleccionada y el botón dice "Pay 5€"

### Expected Behavior (After Fix)

1. Al iniciar el checkout, el email del usuario aparece pre-rellenado en Stripe
2. Después del pago exitoso, el webhook de Stripe marca al usuario como premium en la DB
3. Al redirigir a `/download?autoDownload=true`:
   - La card "Premium" está pre-seleccionada
   - El botón muestra "Download Premium ZIP"
   - La descarga automática se ejecuta

## 2. Technical Analysis

### Conflicting Flow

El flujo actual tiene un problema en el webhook de Stripe:

```
1. Usuario paga → Stripe crea sesión de checkout (SIN customer especificado)
2. Stripe envía webhook con checkout.session.completed
3. Webhook extrae session.customer → ES NULL (no hay customer)
4. Validación: if (userId && typeof stripeCustomerId === 'string')
5. stripeCustomerId es NULL → typeof null !== 'string' → FALSE
6. grantPremium() NUNCA se ejecuta
7. Usuario queda con isPremium = false
```

### Root Cause

**OBVIOUS:** El problema está en `/app/routes/api.stripe.webhook.ts` línea 36:

```typescript
if (userId && typeof stripeCustomerId === 'string') {
    await grantPremium(userId, stripeCustomerId)
}
```

Cuando se crea una sesión de checkout **sin especificar el parámetro `customer`** (como en `stripe.server.ts`), Stripe **no asocia un customer** a la sesión. El campo `session.customer` en el evento `checkout.session.completed` será `null`.

La validación `typeof stripeCustomerId === 'string'` falla porque `null` no es un string, y `grantPremium()` nunca se ejecuta.

**Evidencia adicional:**
- El test `stripe-webhook.spec.ts` usa un payload mock con `customer: 'cus_test_webhook'`
- En un flujo real de Stripe sin customer, este campo es `null`
- Por eso el test pasa pero el flujo real falla

## 3. Solution Plan

**Enfoque elegido:** Crear/buscar Stripe Customer antes del checkout.

Esto soluciona el bug Y mejora la integración con Stripe:
- Email pre-rellenado en checkout
- `session.customer` siempre tiene valor
- Customer reutilizable para futuras compras/reembolsos

### `app/services/stripe.server.ts`
**Objective:** Buscar o crear Stripe Customer antes de crear la sesión de checkout. Pasar el customer ID a la sesión.

**Pseudocode:**
```pseudocode
FUNCTION getOrCreateStripeCustomer(userId, email, name, existingStripeCustomerId)
  INPUT: userId (string), email (string), name (string | null), existingStripeCustomerId (string | null)

  IF existingStripeCustomerId EXISTS THEN
    RETURN existingStripeCustomerId
  END

  // Crear nuevo customer en Stripe
  customer = stripe.customers.create({
    email: email,
    name: name OR undefined,
    metadata: { userId: userId }
  })

  // Guardar el stripeCustomerId en la DB para futuras compras
  UPDATE users SET stripeCustomerId = customer.id WHERE id = userId

  RETURN customer.id
END

FUNCTION createCheckoutSession(userId, email, name, existingStripeCustomerId, origin)
  INPUT: userId, email, name (nullable), existingStripeCustomerId (nullable), origin

  stripeCustomerId = getOrCreateStripeCustomer(userId, email, name, existingStripeCustomerId)

  session = stripe.checkout.sessions.create({
    mode: 'payment',
    customer: stripeCustomerId,  // NUEVO: asociar customer
    line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
    metadata: { userId: userId },  // Mantener para redundancia
    success_url: origin + '/success',
    cancel_url: origin + '/download',
  })

  RETURN session.url
END
```

### `app/routes/api.stripe.checkout.tsx`
**Objective:** Pasar email, name y stripeCustomerId existente al servicio de checkout.

**Pseudocode:**
```pseudocode
ACTION handler(request)
  authSession = getCurrentUser(request)

  IF NOT authSession THEN
    RETURN 401 Unauthorized
  END

  user = authSession.user
  origin = request.url.origin

  // Pasar datos del usuario al servicio
  checkoutUrl = createCheckoutSession(
    userId: user.id,
    email: user.email,
    name: user.name,
    existingStripeCustomerId: user.stripeCustomerId,  // Puede ser null
    origin: origin
  )

  RETURN { url: checkoutUrl }
END
```

### `app/routes/api.stripe.webhook.ts`
**Objective:** Simplificar validación - ya no necesitamos verificar stripeCustomerId porque siempre existirá.

**Pseudocode:**
```pseudocode
BEFORE:
  stripeCustomerId = session.customer
  IF userId AND typeof stripeCustomerId === 'string' THEN
    grantPremium(userId, stripeCustomerId)
  END

AFTER:
  stripeCustomerId = session.customer  // Siempre será string ahora
  IF userId THEN
    // stripeCustomerId ya existe porque creamos el customer antes del checkout
    // Pero mantenemos la validación por seguridad
    customerId = typeof stripeCustomerId === 'string' ? stripeCustomerId : null
    grantPremium(userId, customerId)
  END
```

### `app/services/premium.server.ts`
**Objective:** Aceptar `stripeCustomerId` como opcional (por si acaso).

**Pseudocode:**
```pseudocode
FUNCTION grantPremium(userId: string, stripeCustomerId: string | null)
  user = SELECT FROM users WHERE id = userId

  IF user NOT FOUND THEN
    RETURN  // No hacer nada si el usuario no existe
  END

  IF user.isPremium THEN
    RETURN  // Idempotente: ya es premium
  END

  UPDATE users SET
    isPremium = true,
    premiumSince = NOW(),
    stripeCustomerId = stripeCustomerId  // Puede ser null (aunque raro ahora)
  WHERE id = userId
END
```

### `app/lib/auth.ts` (tipos)
**Objective:** Asegurar que el tipo User incluye stripeCustomerId.

**Pseudocode:**
```pseudocode
// Verificar que el tipo User ya incluye stripeCustomerId
// (debería estar definido en el schema de drizzle)
TYPE User = {
  id: string
  email: string
  name: string | null
  stripeCustomerId: string | null  // Ya existe en schema
  // ...otros campos
}
```

## 4. Regression Tests

### Test 1: Webhook grants premium when customer exists (actualizar test existente)

**Archivo:** `tests/e2e/stripe-webhook.spec.ts`

- **Preconditions:** Usuario existente con `stripeCustomerId` ya guardado
- **Steps:**
  1. Enviar webhook `checkout.session.completed` con `customer: 'cus_xxx'` y `metadata.userId` válido
- **Expected:** `is_premium = true` Y `stripe_customer_id = 'cus_xxx'`

### Test 2: Webhook handles null customer gracefully (nuevo test)

- **Preconditions:** Usuario existente sin `stripeCustomerId`
- **Steps:**
  1. Enviar webhook con `customer: null` y `metadata.userId` válido
- **Expected:** `is_premium = true`, `stripe_customer_id` permanece sin cambios

### Test 3: Checkout endpoint returns URL for authenticated user

**Archivo:** `tests/e2e/stripe-checkout.spec.ts` (si existe, actualizar)

- **Preconditions:** Usuario autenticado
- **Steps:**
  1. POST a `/api/stripe/checkout` con sesión válida
- **Expected:** Response 200 con `{ url: "https://checkout.stripe.com/..." }`

## 5. Definition of Done

1. **ALL tests pass:**
   - `npm run test:e2e -- --retries=1`
   - Tests de webhook actualizados pasan
2. `npm run typecheck` passes
3. `npm run lint` passes
4. Verificación manual del flujo completo:
   - Pagar con tarjeta de test (4242 4242 4242 4242)
   - Verificar que el email aparece pre-rellenado en Stripe
   - Verificar que después del redirect, la card premium está seleccionada
   - Verificar que el botón dice "Download Premium ZIP"
   - Verificar en DB que `is_premium = true` y `stripe_customer_id` tiene valor

## 6. Lessons Learned

**Para agregar a `docs/KNOWN_ISSUES.md`:**

### Stripe Checkout Sessions Without Customer

**Date:** 2026-01-10

**Problem:** El webhook de Stripe `checkout.session.completed` tiene `session.customer = null` cuando no se especifica un `customer` al crear la sesión de checkout.

**Root Cause:** Stripe no crea automáticamente un customer cuando usas `checkout.sessions.create()` sin el parámetro `customer`. El campo `customer` en el evento del webhook será `null`.

**Solution:** Crear o buscar el Stripe Customer antes de crear la sesión de checkout. Esto garantiza que `session.customer` siempre tenga valor y permite pre-rellenar el email del usuario.

**Prevention:**
- Siempre crear/buscar un Stripe Customer antes del checkout
- Guardar el `stripeCustomerId` en la DB del usuario para reutilizarlo
- No depender de campos opcionales de Stripe para lógica crítica

## 7. Files Summary

| Archivo | Cambio |
|---------|--------|
| `app/services/stripe.server.ts` | Agregar `getOrCreateStripeCustomer()`, modificar `createCheckoutSession()` |
| `app/routes/api.stripe.checkout.tsx` | Pasar email, name, stripeCustomerId al servicio |
| `app/routes/api.stripe.webhook.ts` | Hacer stripeCustomerId opcional en la validación |
| `app/services/premium.server.ts` | Cambiar tipo de stripeCustomerId a `string \| null` |
| `tests/e2e/stripe-webhook.spec.ts` | Agregar test con customer null |
