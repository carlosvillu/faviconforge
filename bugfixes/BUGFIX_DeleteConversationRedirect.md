# BUGFIX: Delete Conversation Redirect

## 1. Bug Description

### Current Behavior (Bug)

Cuando un usuario elimina una conversación del chat público:

1. Se muestra correctamente el modal de confirmación
2. Al confirmar, la conversación se borra exitosamente de la base de datos (tanto la conversación como los mensajes)
3. **PROBLEMA:** Después del borrado, la aplicación intenta cargar la página del chat con el query param `?conv=[conversationId]` de la conversación recién eliminada
4. El loader detecta que la conversación no existe y lanza un error 404
5. El usuario ve una página de error en lugar de volver al chat limpio

**Pasos para reproducir:**
1. Usuario logueado navega a `/p/:slug`
2. Inicia una conversación (URL cambia a `/p/:slug?conv=abc-123`)
3. Abre el sidebar y hace click en el icono de eliminar (trash) de la conversación activa
4. Confirma la eliminación en el modal
5. **Observe:** Página muestra error 404 porque intenta cargar `/p/:slug?conv=abc-123` donde `abc-123` ya no existe

### Expected Behavior (After Fix)

Después de confirmar la eliminación de una conversación:

1. La conversación se borra de la base de datos (OK - ya funciona)
2. El usuario es redirigido automáticamente a `/p/:slug` (sin query params)
3. El chat se muestra limpio, listo para una nueva conversación
4. No se muestra ningún error 404

## 2. Technical Analysis

### Conflicting Flow

1. Usuario confirma eliminación en `DeleteConversationDialog`
2. `PublicConversationSidebar` llama a `deletion.requestDelete(conversationId)` (línea 48)
3. Hook `useConversationDeletion` hace `fetcher.submit` con `intent: 'delete-conversation'` al action de `/p/:slug`
4. El **action** en `p.$slug.tsx` (línea 175-195) borra la conversación exitosamente y retorna `{ ok: true, deleted: true }`
5. Como el action **NO hace un redirect**, React Router ejecuta automáticamente un **revalidation** del loader
6. El loader se ejecuta con la **URL actual** que aún contiene `?conv=abc-123`
7. El loader intenta cargar la conversación borrada (línea 114-135)
8. Como no existe, lanza un `404` (línea 122)
9. **Mientras tanto**, el hook `useConversationDeletion` detecta `fetcher.state === 'idle'` y ejecuta `window.location.replace(slugPath)` (línea 39)
10. Pero el error 404 ya fue lanzado y el replace no tiene efecto

**Race condition:** El revalidation del loader ocurre **antes** de que el `window.location.replace` del hook cliente tenga efecto.

### Root Cause

**OBVIOUS:** El action de `delete-conversation` retorna JSON (`{ ok: true, deleted: true }`) en lugar de hacer un **redirect** del lado del servidor. Esto causa que React Router ejecute un revalidation del loader con la URL actual (que aún contiene `?conv=[id-borrado]`), provocando un 404 antes de que el redirect del cliente tenga efecto.

## 3. Solution Plan

### `app/routes/p.$slug.tsx`

**Objective:** Hacer que el action de `delete-conversation` retorne un `redirect()` del lado del servidor en lugar de JSON, eliminando el race condition con el revalidation del loader.

**Pseudocode:**

```pseudocode
ACTION p.$slug
  IF intent === 'delete-conversation' THEN
    // Existing validation and deletion logic (no changes)
    Validate user is authenticated
    Validate conversationId format

    Call deleteConversation service

    IF deletion failed THEN
      RETURN JSON { ok: false, error: result.code, deleted: true }
    END IF

    // CHANGE: Instead of returning JSON, do server-side redirect
    BEFORE:
      RETURN JSON { ok: true, deleted: true }

    AFTER:
      RETURN redirect(`/p/${parsedSlug.data}`)
      // This ensures URL is clean before loader revalidation
  END IF
END ACTION
```

**Additional changes:**

- Import `redirect` from `react-router` at the top of the file (if not already imported)
- The redirect will automatically remove the `?conv` query param
- React Router will revalidate the loader **after** the redirect, so the loader will run with the clean URL

### `app/hooks/useConversationDeletion.ts`

**Objective:** Simplificar el hook eliminando el `window.location.replace` que ya no es necesario porque el action hace el redirect del servidor.

**Pseudocode:**

```pseudocode
HOOK useConversationDeletion
  // Keep existing state and refs

  EFFECT on [fetcher.state, fetcher.data]
    IF fetcher completed AND has data AND lastDeletedIdRef is set THEN
      Reset lastDeletedIdRef

      IF fetcher.data.ok === true THEN
        Show success toast
        Call onClose()
        // REMOVE: window.location.replace(slugPath)
        // No longer needed - server redirect handles this
      ELSE
        Show error toast
      END IF
    END IF
  END EFFECT

  // Keep existing requestDelete function unchanged
END HOOK
```

**Notes:**
- Remove the `navigate` import (no longer needed)
- Remove the `slugPath` parameter from the hook since we won't use it
- The `onClose()` callback will still close the sidebar/modal

### `app/components/public/PublicConversationSidebar.tsx`

**Objective:** Actualizar el uso del hook `useConversationDeletion` para no pasar `slugPath` ya que no se necesita.

**Pseudocode:**

```pseudocode
COMPONENT PublicConversationSidebar
  // Keep existing props and state

  // CHANGE: Remove slugPath parameter
  BEFORE:
    const deletion = useConversationDeletion({
      slugPath: location.pathname,
      onClose: props.onClose,
    })

  AFTER:
    const deletion = useConversationDeletion({
      onClose: props.onClose,
    })

  // Keep all other logic unchanged
END COMPONENT
```

## 4. Regression Tests

### Test: Delete conversation redirects to clean podcast page without 404

**Preconditions:**
- User is logged in
- User has an active conversation on `/p/:slug?conv=[conversationId]`
- TestContainers database is running with the conversation and messages seeded

**Steps:**
1. Navigate to `/p/:slug?conv=[conversationId]` where conversation exists
2. Open the sidebar by clicking the menu icon
3. Hover over the active conversation to reveal the delete button (trash icon)
4. Click the delete button
5. Confirm deletion in the modal dialog
6. Wait for the action to complete

**Expected:**
- User is redirected to `/p/:slug` (without `?conv` query param)
- URL bar shows `/p/:slug` with no query parameters
- Chat interface is displayed clean and ready for new conversation
- **No 404 error is shown**
- Success toast is displayed (as per existing implementation)
- The deleted conversation no longer appears in the sidebar list

### Test: Delete non-active conversation keeps user on current page

**Preconditions:**
- User is logged in
- User has multiple conversations
- User is viewing conversation A at `/p/:slug?conv=[conversationA]`

**Steps:**
1. Navigate to `/p/:slug?conv=[conversationA]`
2. Open the sidebar
3. Hover over conversation B (not the active one)
4. Click the delete button for conversation B
5. Confirm deletion in the modal

**Expected:**
- User stays on `/p/:slug?conv=[conversationA]` (active conversation unchanged)
- Conversation B is removed from sidebar list
- Conversation A messages are still displayed
- No 404 error occurs

## 5. Lessons Learned

**To be added to `docs/KNOWN_ISSUES.md` after implementation:**

### Server-side Redirects for Mutating Actions

**Discovered in:** BUGFIX_DeleteConversationRedirect.md
**Date:** 2025-12-23

**Problem:** When a React Router action deletes or modifies data that affects the current URL's validity (like deleting a resource referenced in query params), returning JSON instead of a redirect causes a race condition. The loader revalidates with the old URL before client-side navigation executes, resulting in 404/403 errors.

**Root Cause:**
- Actions that return JSON trigger automatic loader revalidation with the **current URL**
- Client-side redirects (via `navigate()` or `window.location`) execute **after** revalidation
- If the current URL references deleted data, the loader throws before the redirect completes

**Solution:**
- Actions that delete/modify resources affecting URL validity **must return `redirect()`** instead of JSON
- Server-side redirects execute **before** loader revalidation, ensuring clean state
- Pattern: `return redirect('/clean-url')` instead of `return { ok: true }`

**Prevention:**
- When writing action handlers that delete resources referenced in the current URL (query params, path params), always use `redirect()`
- Reserve JSON responses for actions where the URL remains valid after the mutation
- Client-side redirects should only be used for navigation unrelated to the action result

**Example:**
```typescript
// BAD - causes race condition
if (deleteSuccess) {
  return { ok: true }  // Loader revalidates with stale URL
}

// GOOD - clean redirect before revalidation
if (deleteSuccess) {
  return redirect('/clean-url')
}
```
