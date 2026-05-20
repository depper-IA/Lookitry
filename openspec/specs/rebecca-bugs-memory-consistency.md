# SPEC: Rebecca Chat - Bugs de Memoria y Consistencia

## Status
- **Phase**: spec
- **Author**: el Gentleman
- **Date**: 2026-05-19

---

## 1. Problema

Rebecca, agente de chat web y WhatsApp de Lookitry, presenta 7 bugs reportados por Sam:

| # | Bug | Prioridad |
|---|-----|-----------|
| 1 | Pierde contexto / no guarda memoria | 🔴 Alta |
| 2 | Abre enlaces en nueva pestaña y reinicia mensaje | 🔴 Alta |
| 3 | Vuelve a preguntar lo mismo | 🔴 Alta |
| 4 | Envía enlaces repetidos | 🟡 Media |
| 5 | Habla en distintos acentos | 🟡 Media |
| 6 | Redunda demasiado | 🟡 Media |
| 7 | Acento neutral obligatorio | 🟢 Baja |

---

## 2. Arquitectura Actual

### Canales
| Canal | Frontend | Backend |
|-------|----------|---------|
| **Web** | `frontend/src/components/chat-widget/` | `backend/src/services/rebecca-chat.service.ts` |
| **WhatsApp** | — | `supabase/functions/whatsapp-agent/` |

### Causas raíz identificadas

| Bug | Causa |
|-----|-------|
| Pierde contexto | `useChatSession` usa `useState` en memoria React. Se pierde al recargar la página o cambiar de ruta. Sin persistencia en Supabase para web. |
| Habla acentos | El prompt fuerza "neutro" pero `CHANNEL_INSTRUCTIONS_WEB` usa "Completá" (rioplatense). Inconsistencia entre identidad y canal. |
| Redunda | Límites de caracteres web: 2400 chars (demasiado permisivo). Sin instrucción de no repetir. |
| Enlaces repetidos | Prompt: "OBLIGATORIO INCLUIR EN CADA RESPUESTA RELEVANTE". Rebecca siempre incluye enlace sin detectar si ya se envió. |
| Nueva pestaña | Comportamiento default de `<a target="_blank">` en el componente ChatMessage que renderiza los enlaces. No hay control de `rel="noopener"`. |
| Vuelve a preguntar | History limitada a 10 mensajes en memoria. Sin contexto de conversación previa persistente. |
| Consistencia acentos | `IDENTITY_BY_LOCALE` usa `resolvedLocale = 'default'` pero las channel instructions de web tienen regionalismos. |

---

## 3. Solución

### 3.1 Persistencia de memoria (Bug #1, #3)

**Reutilizar tablas existentes de Supabase:**
- `lead_conversations` — para sesiones de chat (con `source='web'`)
- `lead_messages` — para mensajes (con `sender_type='lead'` / `'assistant'`)

**Cambios en `frontend/src/components/chat-widget/hooks/useChatSession.ts`:**

1. Generar `sessionId` persistente (localStorage o fingerprint)
2. Al guardar mensaje → upsert en `lead_conversations` + insert en `lead_messages`
3. Al iniciar → cargar historial desde `lead_messages` por sessionId
4. Mantener `useState` solo para UI, persistir a BD en background

**API endpoint:** `GET /api/chat/widget/history?session_id=xxx` — carga historial por sessionId (platform_id)

### 3.2 Consistencia de acento (Bug #5, #6)

**Cambios en `backend/src/services/rebecca-identity.service.ts`:**

1. Eliminar regionalismos de `CHANNEL_INSTRUCTIONS_WEB`:
   - `es-CO`, `es-AR`, `es-MX`, `es-ES`, `default` → usar "Completa" (neutro), no "Completá"
   - Eliminar "tú" vs "vos" —統一 a "tú"

2. Agregar instrucción explícita en el prompt del modelo:
```
## REGLA DE CONSISTENCIA
- Usa SIEMPRE el mismo estilo y tono en toda la conversación.
- NUNCA cambies de vocabulario según el país del usuario.
- NO repitas enlaces que ya enviaste en la misma conversación.
```

### 3.3 No repetir enlaces (Bug #4)

**Cambios en `backend/src/services/rebecca-chat.service.ts`:**

1. Incluir historial de enlaces ya enviados en el context
2. Modificar el system prompt para incluir:
```
## ENLACES YA ENVIADOS
{enlaces_enviados}

Regla: NO incluyas enlaces que ya aparecieron en la conversación. Si el cliente pide info que ya le diste, resumí sin repetir el enlace.
```

2. Cambiar límite de caracteres de 2400 a 1200 para web (reducir redundancia)

### 3.4 Enlaces en misma pestaña (Bug #2)

**Cambios en `frontend/src/components/chat-widget/ChatMessage.tsx`:**

Antes de renderizar enlaces, normalizar:
- Si es link externo → `target="_blank" rel="noopener noreferrer"`
- Si es link interno (same host) → `target="_self"` (misma pestaña)

Además: guardar estado del mensaje antes de navegar para no perder contexto.

---

## 4. No-goals

- No modificar el prompt de WhatsApp (funciona bien, solo afecta web)
- No cambiar la lógica de detección de intención (no está rota)
- No modificar el historial de WhatsApp (usa dedup diferente)

---

## 5. Aceptación

| # | Criterio |
|---|----------|
| 1 | Abrir chat web, cerrar, reabrir → mensajes previos visibles |
| 2 | Enlaces internos abren en misma pestaña, externos en nueva |
| 3 | Rebecca no repite la misma info 2 veces seguidas |
| 4 | Rebecca no envía 2x el mismo enlace en una conversación |
| 5 | Rebecca mantiene un solo acento (neutro) durante toda la conversación |
| 6 | Rebecca no hace la misma pregunta dos veces |

---

## 6. Dependencias

- Tablas `lead_conversations` y `lead_messages` en Supabase (ya existen)
- API endpoint `GET /api/chat/widget/history?session_id=xxx` (nuevo, usa tablas existentes)
- Supabase service role key disponible en backend env