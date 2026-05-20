# TASKS: Rebecca Chat - Bugs de Memoria y Consistencia

## Status
- **Phase**: tasks
- **Parent**: openspec/specs/rebecca-bugs-memory-consistency.md
- **Author**: el Gentleman
- **Date**: 2026-05-19

---

## Task 1: Persistencia de memoria web (Bugs #1, #3)

**Files:**
- `frontend/src/components/chat-widget/hooks/useChatSession.ts`
- `backend/src/routes/chat.routes.ts`
- `backend/src/controllers/chat.controller.ts`

**Steps:**
1. [ ] En `useChatSession.ts`:
   - Generar `sessionId` persistente en localStorage (key: `rebecca_session_id`)
   - Si existe, usar el mismo; si no, crear UUID y guardar
   - Al hacer `addMessage`, guardar en backend via POST `/api/chat/widget/message`
   - Al iniciar hook, cargar historial via GET `/api/chat/widget/history?session_id=xxx`
   - Cargar historial ANTES de renderizar (inicializar `messages` state desde DB)

2. [ ] En `chat.controller.ts`:
   - Crear método `saveMessage(sessionId, role, content)`:
     - Upsert `lead_conversations` con `source='web'`, `platform_id=sessionId`
     - Insert `lead_messages` con `sender_type='lead'` o `'assistant'`

3. [ ] En `chat.routes.ts`:
   - GET `/widget/history` — retorna mensajes por sessionId
   - POST `/widget/message` — guarda mensaje

---

## Task 2: Consistencia de acento (Bug #5)

**Files:**
- `backend/src/services/rebecca-identity.service.ts`

**Steps:**
1. [ ] Reemplazar TODOS los `CHANNEL_INSTRUCTIONS_WEB` por uno neutro:
   ```typescript
   const CHANNEL_INSTRUCTIONS_WEB_NEUTRAL = '- Completa SIEMPRE tus pensamientos. ';
   ```
2. [ ] Eliminar regionalismos: "Completá", "dale", "che", etc.
3. [ ] Unificar "tú" (no "vos")
4. [ ] Verificar que `IDENTITY_BY_LOCALE` use `resolvedLocale = 'default'`

---

## Task 3: No repetir enlaces (Bug #4)

**Files:**
- `backend/src/services/rebecca-identity.service.ts`
- `backend/src/services/rebecca-chat.service.ts`

**Steps:**
1. [ ] Agregar al prompt (en `getSystemPrompt`):
   ```
   ## ENLACES YA ENVIADOS
   {enlaces_previos}
   
   Regla: NO incluyas enlaces que ya aparecieron. Si el cliente pide info que ya le diste, resumí sin repetir.
   ```

2. [ ] En `replyForChannel`, extraer enlaces de `history` y pasarlos como `{enlaces_previos}`

3. [ ] Reducir límite de caracteres web de 2400 a 1200 (const `CHANNEL_LIMITS.web`)

---

## Task 4: Enlaces en misma pestaña (Bug #2)

**Files:**
- `frontend/src/components/chat-widget/ChatMessage.tsx`

**Steps:**
1. [ ] Detectar si link es interno (mismo host) o externo
2. [ ] Si interno → `target="_self"`
3. [ ] Si externo → `target="_blank" rel="noopener noreferrer"`
4. [ ] Verificar que no se pierda el mensaje al hacer click en link

---

## Task 5: Instrucciones anti-redundancia en prompt (Bug #6)

**Files:**
- `backend/src/services/rebecca-identity.service.ts`

**Steps:**
1. [ ] Agregar regla explícita:
   ```
   ## REGLA DE CONCISIDAD
   - NO repitas información que ya diste en mensajes anteriores.
   - NO envíes el mismo enlace dos veces.
   - Si el usuario pregunta algo que ya respondiste, simplemente confirma o amplía, NO repitas todo.
   ```

---

## Estimación de cambios

| Task | Archivos | Líneas aprox |
|------|----------|--------------|
| 1 | 3 | ~100 |
| 2 | 1 | ~20 |
| 3 | 2 | ~40 |
| 4 | 1 | ~30 |
| 5 | 1 | ~10 |
| **Total** | 8 | **~200** |

**Dentro del budget de 400 líneas.**

---

## Orden de implementación

1. Task 2 (acento) — rápido, sin dependencias
2. Task 3 (enlaces) — modifica prompt
3. Task 5 (anti-redundancia) — modifica prompt
4. Task 4 (same tab) — frontend
5. Task 1 (persistencia) — requiere backend + frontend