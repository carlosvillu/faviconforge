# BUGFIX: Public Chat Delete Conversation Does Not Reset Messages

Status: Fixed

## 1. Bug Description

### Current Behavior (Bug)

En el chat público (`/p/:slug`), cuando el usuario elimina una conversación desde el sidebar:

- La conversación se elimina correctamente.
- La navegación SSR elimina correctamente el query param `?conv=...` (la URL queda como `/p/:slug`).
- **PROBLEMA:** la ventana principal del chat sigue mostrando mensajes antiguos (parte del historial) aunque ya no haya conversación activa.

**Observación clave:** tras el delete, desaparece el **primer mensaje del usuario**, pero **el resto de mensajes de esa conversación siguen visibles** como si el chat se hubiese quedado con estado en memoria.

**Steps to reproduce:**
1. Estar logueado.
2. Navegar a `/p/:slug`.
3. Iniciar una conversación (la URL cambia a `/p/:slug?conv=<conversationId>`).
4. Generar varios mensajes (usuario + asistente).
5. Abrir sidebar y eliminar la conversación.
6. Observar: URL vuelve a `/p/:slug` (sin `?conv`), pero el chat sigue mostrando mensajes antiguos (menos el primer mensaje del user).

### Expected Behavior (After Fix)

Después de borrar una conversación en `/p/:slug`:

1. La URL queda en `/p/:slug` (sin `?conv`).
2. El chat se muestra **completamente limpio**, es decir:
   - `ChatMessageList` recibe `messages=[]`.
   - Se renderiza el estado “welcome” (sin mensajes previos).
   - No quedan mensajes antiguos en pantalla.

## 2. Technical Analysis

### Conflicting Flow

1. `PublicConversationSidebar` dispara el submit con `intent=delete-conversation`.
2. `app/routes/p.$slug.tsx` borra en BBDD y retorna `redirect('/p/:slug')`.
3. El loader de `p.$slug` vuelve a ejecutarse con URL limpia, por lo que:
   - `activeConversationId` es `undefined`.
   - `initialMessages` es `[]`.
4. En el cliente, `PublicPodcastRoute` llama a `usePodcastChat({ initialConversationId, initialMessages })`.
5. **Bug:** a pesar de que el loader ya no trae mensajes, `ChatMessageList` termina renderizando parte del estado anterior.

### Root Cause

**NO OBVIO (pero probable):** El estado interno del chat (`usePodcastChat`) persiste a través del redirect/revalidation del mismo route module y el reset basado en `useEffect` no es suficiente para garantizar un “hard reset” del UI en este flujo.

Teorías más plausibles (máx 3):

1. **Persistencia del árbol React (no remount) + reset por efecto no determinista**
   - El route module sigue siendo el mismo (`/p/:slug`), cambia solo el search.
   - React Router puede revalidar/actualizar datos sin desmontar el árbol.
   - `usePodcastChat` mantiene `messages` en `useState` y el reset depende de que se detecte el cambio de `initialConversationId`.
   - En algún timing concreto tras borrar, parte del UI puede seguir usando `messages` “stale”.

2. **Interacción con `fetcher.data` y render intermedio**
   - `usePodcastChat` mezcla:
     - `messages` (local state)
     - `fetcher.data` (respuesta del último submit)
     - `params.initialMessages` (loader)
   - Tras el delete + redirect, si hay renders intermedios donde `conversationHasChanged` no se evalúa como esperamos, se puede “colar” estado anterior.

3. **Keying/identity de mensajes vs reconciliación**
   - Si los `id` de mensajes y el árbol de `ChatMessageList` reutilizan nodos (por keys repetidas o estados pendientes), React puede reconciliar de forma inesperada parte del listado.

#### Investigation steps (para validar/descartar)

- Log temporal (solo en branch de debug) en `usePodcastChat`:
  - valores de `params.initialConversationId`
  - `prevConversationIdRef.current`
  - `messages.length` y `params.initialMessages?.length`
  - `fetcher.data` presente y su contenido
- Confirmar si, tras el redirect, el componente que usa `usePodcastChat` **se desmonta o no**.
- Confirmar si el bug se reproduce también cuando:
  - se borra una conversación no activa
  - hay un submit en curso

## 3. Solution Plan

### Objetivo

Hacer que al pasar de “hay conversación activa” → “no hay conversación activa” el chat haga un reset **determinista** del estado interno, sin depender de efectos/timing.

### Solución preferida (elegante): Forzar remount del chat por `key`

**Idea:** Renderizar el “sub-árbol del chat” con un `key` derivado del `activeConversationId`. Cuando el id cambia (incluyendo `undefined`), React desmonta y monta de nuevo, reseteando todo estado interno (`useState`, refs, etc.).

Esto es más limpio que un hard reload y evita hacks con query params.

#### `app/routes/p.$slug.tsx`

**Objective:** Forzar remount del árbol que contiene `usePodcastChat` / `ChatShell` cuando `activeConversationId` cambia (incluyendo cuando se limpia tras delete).

**Pseudocode:**
```pseudocode
COMPONENT PublicPodcastRoute
  data = useLoaderData()

  chatKey = data.activeConversationId ?? 'no-conversation'

  RENDER ChatShell subtree with key=chatKey
    usePodcastChat(...) lives inside that subtree
END
```

Notas:
- El `key` debería estar lo más “arriba” posible en el subtree que incluye el estado a resetear.
- Si `usePodcastChat` se ejecuta fuera del subtree keyed, no servirá: el hook no se desmontará.

### Fallback (aceptable pero hack): hard reload controlado

Si por alguna limitación de arquitectura no se puede keyear el subtree correctamente:

- tras delete, redirigir a `/p/:slug?reset=<random>` y en loader/route, si detecta `reset`, hacer `redirect('/p/:slug')`.
- Alternativamente, `window.location.assign('/p/:slug')`.

Esto fuerza recarga completa y garantiza reset, pero es peor UX y más frágil.

## 4. Regression Tests (E2E Only)

### Test: Deleting active conversation resets chat UI (no stale messages)

- **Preconditions:**
  - Usuario logueado
  - Existe un podcast público accesible
  - Existe una conversación con varios mensajes asociada al usuario y al podcast

- **Steps:**
  1. Navegar a `/p/:slug?conv=<conversationId>`
  2. Verificar que hay varios mensajes renderizados
  3. Abrir sidebar
  4. Eliminar la conversación (trash + confirm)
  5. Esperar navegación a `/p/:slug` (sin `?conv`)

- **Expected:**
  - URL termina en `/p/:slug` sin query `conv`
  - El chat muestra estado vacío (welcome)
  - `ChatMessageList` no muestra ningún mensaje antiguo

## 5. Lessons Learned (Optional)

Si el fix final es `key` para remount:

- Documentar en `docs/KNOWN_ISSUES.md` una lección del estilo:
  - “Cuando un route revalida datos sin desmontar el árbol, los estados locales tipo chat deben resetearse de forma determinista (keyed remount) cuando cambia el identificador de la conversación.”
