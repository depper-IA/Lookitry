# SPEC: Rebecca 2.0 — Ventas Inteligentes

**Versión:** 1.0
**Fecha:** 2026-05-17
**Status:** Draft
**Stakeholder:** Sam Wilkie

---

## 1. Contexto y Motivación

Rebecca es la asesora de ventas IA de Lookitry. Actualmente:
- Responde preguntas sobre planes, precios y proceso
- Usa RAG para buscar en `lookitry_knowledge`
- **No aprende** de las conversaciones exitosas
- **No comparte enlaces** para compra directa
- **No sabe en qué página** está el lead
- **Respuestas a veces demasiado largas**

**Objetivo:** Transformar Rebecca en un agente de ventas proactivo que aprende de patrones exitosos, comparte enlaces contextuales, y guía al lead hacia la conversión.

---

## 2. Goals (OKRs)

| Goal | Métrica |
|------|---------|
| Aumentar conversión de leads en /demo | +20% en 30 días |
| Reducir tiempo de respuesta promedio | <150 caracteres por mensaje |
| Leads que comparten enlaces | >60% clicks en enlaces compartidos |

---

## 3. Sistema de Aprendizaje (B+C Híbrido)

### 3.1 Nueva Tabla `sales_patterns`

```sql
CREATE TABLE sales_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_phrase text NOT NULL,
  rebecca_response text NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('converted', 'abandoned', 'escalated')),
  lead_session_id text,
  lead_email text,
  brand_id uuid REFERENCES brands(id) ON DELETE SET NULL,
  plan_purchased text,
  revenue_cents integer,
  created_at timestamptz DEFAULT now(),
 ANALYZED_AT timestamptz
);

CREATE INDEX idx_sales_patterns_trigger ON sales_patterns(trigger_phrase);
CREATE INDEX idx_sales_patterns_outcome ON sales_patterns(outcome);
CREATE INDEX idx_sales_patterns_created ON sales_patterns(created_at);
```

### 3.2 Flujo de Captura

```
Lead interactúa con Rebecca
        ↓
Chat controller detecta intención (pricing_question | checkout_intent | demo_request | objection)
        ↓
Registro en sales_patterns
        ↓
Si lead convierte (webhook Wompi/PayPal):
  outcome = 'converted'
  plan_purchased = 'starter'|'professional'|'enterprise'
  revenue_cents = monto en COP
        ↓
Si lead no responde en 7 días:
  outcome = 'abandoned'
```

### 3.3 Análisis Semanal (Cron)

**Archivo:** `backend/src/scheduler/sales-patterns-analyzer.ts`

```typescript
// Cada domingo a las 2am
cron.schedule('0 2 * * 0', async () => {
  const patterns = await analyzeWeeklyPatterns();
  // patterns = { trigger: "precios", best_response: "...", conversions: 15, total: 20 }
  await upsertToKnowledge(patterns);
});
```

**Lógica:**
1. Query `sales_patterns` donde `outcome = 'converted'`
2. Group by `trigger_phrase`
3. Calcular: `{ trigger, best_responses[], conversion_rate, avg_revenue }`
4. Si `conversion_rate > 0.6`: generar entry en `lookitry_knowledge` categoría `ventas_exitosas`
5. Marcar `analyzed_at = now()`

### 3.4 Detección de Intención

**Enum `lead_intent`:**
```typescript
type lead_intent =
  | 'pricing_question'   // "cuánto cuesta", "precios", "planes"
  | 'checkout_intent'    // "quiero comprar", "cómo pago", "activar"
  | 'demo_request'        // "cómo funciona", "demo", "ver prueba"
  | 'objection'          // "es caro", "no me sirve", "pienso"
  | 'greeting'           // "hola", "buenos días"
  | 'info_request'       // "qué incluye", "diferencias", "características"
  | 'unknown';
```

**Detección en `rebecca-chat.service.ts`:**
```typescript
function detectIntent(message: string): lead_intent {
  const lower = message.toLowerCase();
  if (/cuánto cuesta|precios|plan|pasarela/.test(lower)) return 'pricing_question';
  if (/comprar|pagar|activar|checkout|empieza/.test(lower)) return 'checkout_intent';
  if (/demo|cómo funciona|ver|prueba|como uso/.test(lower)) return 'demo_request';
  if (/es caro|no me sirve|pienso|mejor|alternativa/.test(lower)) return 'objection';
  if (/hola|buenos|buenas|saludos/.test(lower)) return 'greeting';
  return 'unknown';
}
```

---

## 4. Enlaces Contextuales

### 4.1 Mapa de Enlaces

| Intención | Enlace | Ejemplo de Mensaje |
|-----------|--------|-------------------|
| `pricing_question` | `https://lookitry.com/plans` | "Aquí tienes todos los planes con precios actualizados → [Ver Planes](url)" |
| `checkout_intent` | `https://lookitry.com/checkout/{brand_slug}` | "Puedes activar tu plan directamente → [Ir al Checkout](url)" |
| `demo_request` | `https://lookitry.com/demo` | "Mira cómo funciona en 2 minutos → [Ver Demo](url)" |
| `objection` | `https://lookitry.com/plans#faq` | "Entiendo. Aquí respondemos las preguntas más comunes → [FAQ](url)" |

### 4.2 Enriquecimiento del Contexto

**Nuevo campo `context` en widget API:**

```typescript
// Tipos en frontend
interface ChatContext {
  page_url: string;      // "/demo", "/plans", "/checkout/professional"
  page_title: string;     // "Lookitry Demo - Virtual Try-On"
  source: 'demo' | 'widget' | 'whatsapp';
  brand_slug?: string;   // solo si está en branded journey
}

// Endpoint: POST /api/chat/widget
interface WidgetRequest {
  session_id: string;
  message: string;
  history: ChatMessage[];
  context: ChatContext;
}
```

**Uso en backend:**
```typescript
// En rebecca-chat.service.ts
function buildContextualLinks(context: ChatContext) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

  return {
    plans: `${baseUrl}/plans`,
    checkout: context.brand_slug
      ? `${baseUrl}/checkout/${context.brand_slug}`
      : `${baseUrl}/checkout`,
    demo: `${baseUrl}/demo`,
    faq: `${baseUrl}/plans#faq`
  };
}
```

### 4.3 Integración en System Prompt

**Nuevo bloque en `SYSTEM_PROMPT_TEMPLATE`:**

```
ENLACES DE CONVERSIÓN:
- Planes y precios: {plans_url}
- Checkout directo: {checkout_url}
- Demo interactiva: {demo_url}

REGLAS DE COMPARTIR ENLACES:
- Si el lead pregunta precios → SIEMPRE compartir {plans_url}
- Si el lead quiere comprar → SIEMPRE compartir {checkout_url}
- Si el lead pregunta cómo funciona → SIEMPRE compartir {demo_url}
- Los enlaces van AL FINAL del mensaje, nunca en el medio
- Formato: "→ [Texto clickeable](url)"
```

---

## 5. Respuestas Cortas (max_output_tokens)

### 5.1 Configuración de Longitud

**Canal WhatsApp:**
- `maxOutputTokens: 50` (~200 caracteres)
- Mensaje: "Máximo 200 caracteres"

**Canal Web:**
- `maxOutputTokens: 150` (~600 caracteres)
- Mensaje: "Máximo 3 párrafos"

### 5.2 Implementación

**En `rebecca-chat.service.ts`:**

```typescript
async function replyForChannel(
  channel: 'web' | 'whatsapp',
  sessionId: string,
  message: string,
  history: ChatMessage[],
  locale: string,
  context: ChatContext
): Promise<string> {
  const knowledge = await getKnowledgeContext();
  const links = buildContextualLinks(context);

  const prompt = buildSystemPrompt(locale, channel, knowledge, links);
  const generationConfig = channel === 'whatsapp'
    ? { maxOutputTokens: 50, temperature: 0.7 }
    : { maxOutputTokens: 150, temperature: 0.7 };

  const result = await vertexService.generateContent(prompt, {
    model: 'gemini-2.5-flash',
    generationConfig
  });

  return result.text;
}
```

### 5.3 Fallback si respuesta demasiado larga

Si `result.text.length > maxChars`, truncar al último punto completo:

```typescript
function truncateToLimit(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const truncated = text.substring(0, maxChars);
  const lastPeriod = truncated.lastIndexOf('.');
  return lastPeriod > maxChars * 0.7
    ? truncated.substring(0, lastPeriod + 1)
    : truncated + '...';
}
```

---

## 6. Sistema de Recordatorios

### 6.1 Redis Keys

```typescript
// Lead visitó /plans pero no compró en 24h
`reminder:plans:{lead_session_id}` → TTL 24h

// Lead llegó a /checkout pero abandonó
`reminder:checkout_abandoned:{lead_session_id}` → TTL 48h

// Pending reminders queue
`queue:pending_reminders` → Lista Redis
```

### 6.2 Flujo de Recordatorios

```
Lead visita /plans
        ↓
Backend detecta (page_url en contexto)
        ↓
SET reminder:plans:{session_id} { page: '/plans', visited_at: now() } EX 86400
        ↓
[24h después, no compró]
        ↓
LPUSH queue:pending_reminders { session_id, type: 'plans_visit', visited_at }
```

### 6.3 Recordatorio en Conversación

**Trigger:** Cuando lead vuelve a chatear, backend verifica:

```typescript
async function checkPendingReminders(sessionId: string): Promise<string|null> {
  const plansKey = await redis.get(`reminder:plans:${sessionId}`);
  const checkoutKey = await redis.get(`reminder:checkout_abandoned:${sessionId}`);

  if (checkoutKey) {
    return "Vi que quedaste en el checkout ayer. ¿Necesitas ayuda con el proceso de activación?";
  }
  if (plansKey) {
    return "Vi que viste los planes hace un rato. ¿Tienes alguna duda antes de elegir el tuyo?";
  }
  return null;
}
```

### 6.4 Checkout Abandoned Tracking

**Frontend:** Nuevo endpoint para tracking:

```typescript
// POST /api/chat/track-page
interface TrackPageRequest {
  session_id: string;
  page_url: string;
  event: 'visit' | 'checkout_start' | 'checkout_complete';
}
```

** Eventos:**
- `checkout_start` → Set Redis key `checkout_abandoned:{session_id}` con TTL 48h
- `checkout_complete` → Delete Redis key `checkout_abandoned:{session_id}`

---

## 7. Detección de Página Actual

### 7.1 Widget Frontend

**En `ChatWidget.tsx`:**

```typescript
// Captura contexto de página
const getPageContext = (): ChatContext => ({
  page_url: window.location.pathname,
  page_title: document.title,
  source: window.location.pathname === '/demo' ? 'demo' : 'widget'
});

// Envía con cada mensaje
const sendMessage = async (message: string) => {
  await fetch('/api/chat/widget', {
    method: 'POST',
    body: JSON.stringify({
      session_id: sessionId,
      message,
      history,
      context: getPageContext()
    })
  });
};
```

### 7.2 Uso por Página

| Página | Comportamiento de Rebecca |
|--------|--------------------------|
| `/demo` | Asume lead nuevo → explica qué es Lookitry antes de vender |
| `/plans` | Lead comparando → ayuda a elegir plan, compartir comparación |
| `/checkout` | Lead en proceso → reduce objeciones, facilita pago |
| Otra | Comportamiento estándar |

### 7.3 Prompt Dinámico por Página

**Blque adicional en system prompt cuando `source = 'demo'`:**

```
CONTEXTO DE PÁGINA:
El lead está en la página de DEMO. Aún no conoce Lookitry.
- Explica qué es Lookitry de forma simple (2-3 oraciones)
- Destaca el beneficio principal: "muestra cómo quedan tus prendas en tus clientes"
- Invita a probar o ver los planes
```

---

## 8. Cambios en BD

### 8.1 Migración SQL

**Archivo:** `backend/src/migrations/20260517_rebecca_v2_sales_patterns.sql`

```sql
-- Tabla principal de patrones de venta
CREATE TABLE IF NOT EXISTS sales_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_phrase text NOT NULL,
  rebecca_response text NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('converted', 'abandoned', 'escalated')),
  lead_session_id text,
  lead_email text,
  brand_id uuid REFERENCES brands(id) ON DELETE SET NULL,
  plan_purchased text,
  revenue_cents integer,
  intent_detected text,
  created_at timestamptz DEFAULT now(),
  analyzed_at timestamptz
);

CREATE INDEX idx_sales_patterns_trigger ON sales_patterns(trigger_phrase);
CREATE INDEX idx_sales_patterns_outcome ON sales_patterns(outcome);
CREATE INDEX idx_sales_patterns_created ON sales_patterns(created_at);
CREATE INDEX idx_sales_patterns_analyzed ON sales_patterns(analyzed_at) WHERE analyzed_at IS NULL;

-- View para patrones exitosos
CREATE OR REPLACE VIEW successful_sales_patterns AS
SELECT
  trigger_phrase,
  rebecca_response,
  COUNT(*) as total_conversions,
  AVG(revenue_cents) as avg_revenue,
  STRING_AGG(DISTINCT plan_purchased, ', ') as plans_sold
FROM sales_patterns
WHERE outcome = 'converted' AND analyzed_at IS NULL
GROUP BY trigger_phrase, rebecca_response
HAVING COUNT(*) >= 3;
```

### 8.2 Índices Adicionales en Tablas Existentes

```sql
-- En lead_messages, índice para buscar conversaciones recientes
CREATE INDEX idx_lead_messages_recent ON lead_messages(created_at DESC) WHERE created_at > now() - interval '30 days';

-- En lookitry_knowledge, índice para категория ventas_exitosas
CREATE INDEX idx_lookitry_knowledge_category ON lookitry_knowledge(category) WHERE is_active = true;
```

---

## 9. Cambios en API

### 9.1 Endpoint `POST /api/chat/widget`

**Request:**
```typescript
interface WidgetRequest {
  session_id: string;      // UUID, max 128
  message: string;         // max 1000 chars
  history: ChatMessage[];  // max 10 items
  context: ChatContext;    // NUEVO: información de página
}

interface ChatContext {
  page_url: string;        // "/demo", "/plans", etc.
  page_title?: string;     // "Lookitry - Plans"
  source: 'demo' | 'widget' | 'whatsapp';
  brand_slug?: string;     // si está en branded journey
}
```

**Response:** Sin cambios ( `{ reply: string }` )

### 9.2 Endpoint `POST /api/chat/track-page` (NUEVO)

**Request:**
```typescript
interface TrackPageRequest {
  session_id: string;
  page_url: string;
  event: 'visit' | 'checkout_start' | 'checkout_complete';
}
```

**Response:**
```typescript
interface TrackPageResponse {
  success: boolean;
  reminder_scheduled?: boolean;
}
```

### 9.3 Endpoint `GET /api/chat/reminders/:sessionId`

**Response:**
```typescript
interface RemindersResponse {
  pending_reminders: Array<{
    type: 'plans_visit' | 'checkout_abandoned';
    visited_at: string;
    message: string;  // mensaje sugerido para Rebecca
  }>;
}
```

---

## 10. Cambios en Frontend

### 10.1 Widget — Captura de Contexto

**Archivo:** `frontend/src/components/chat-widget/hooks/useChatSend.ts`

```typescript
// Modificar useChatSend para incluir contexto
const useChatSend = () => {
  const sendMessage = async (message: string) => {
    const context = {
      page_url: window.location.pathname,
      page_title: document.title,
      source: window.location.pathname === '/demo' ? 'demo' : 'widget'
    };

    const response = await fetch('/api/chat/widget', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id, message, history, context })
    });
    // ...
  };
};
```

### 10.2 Tracking de Checkout Abandoned

**En página de checkout:**

```typescript
// frontend/src/app/checkout/[brand]/page.tsx
useEffect(() => {
  // Notificar al backend que el lead llegó al checkout
  fetch('/api/chat/track-page', {
    method: 'POST',
    body: JSON.stringify({
      session_id: getSessionId(),
      page_url: '/checkout',
      event: 'checkout_start'
    })
  });
}, []);

// Cuando completa compra:
useEffect(() => {
  if (paymentSuccess) {
    fetch('/api/chat/track-page', {
      method: 'POST',
      body: JSON.stringify({
        session_id: getSessionId(),
        page_url: '/checkout',
        event: 'checkout_complete'
      })
    });
  }
}, [paymentSuccess]);
```

---

## 11. Cron Jobs

### 11.1 Sales Patterns Analyzer

**Archivo:** `backend/src/scheduler/sales-patterns-analyzer.ts`

```typescript
// Every Sunday at 2am
cron.schedule('0 2 * * 0', async () => {
  logger.info('Starting weekly sales patterns analysis');

  const successfulPatterns = await db.query(`
    SELECT trigger_phrase, rebecca_response, plan_purchased, revenue_cents
    FROM sales_patterns
    WHERE outcome = 'converted'
      AND analyzed_at IS NULL
      AND created_at > now() - interval '7 days'
  `);

  // Group by trigger phrase
  const grouped = groupBy(successfulPatterns, 'trigger_phrase');

  for (const [trigger, patterns] of Object.entries(grouped)) {
    if (patterns.length >= 3) {
      const avgRevenue = avg(patterns.map(p => p.revenue_cents));
      const topPlans = mostFrequent(patterns.map(p => p.plan_purchased));

      await knowledgeService.upsert({
        category: 'ventas_exitosas',
        title: `Patrón exitoso: "${trigger}"`,
        content: `Cuando un lead pregunta sobre "${trigger}", las respuestas más exitosas incluyen: ${patterns[0].rebecca_response}. Este patrón tuvo ${patterns.length} conversiones con revenue promedio de ${avgRevenue} COP. Planes más vendidos: ${topPlans}.`
      });
    }
  }

  // Mark as analyzed
  await db.query(`
    UPDATE sales_patterns
    SET analyzed_at = now()
    WHERE outcome = 'converted'
      AND analyzed_at IS NULL
  `);

  logger.info('Sales patterns analysis completed');
});
```

### 11.2 Reminder Processor

**Archivo:** `backend/src/scheduler/reminder-processor.ts`

```typescript
// Every hour
cron.schedule('0 * * * *', async () => {
  const pendingReminders = await redis.lrange('queue:pending_reminders', 0, -1);

  for (const reminder of pendingReminders) {
    const { session_id, type, visited_at } = JSON.parse(reminder);

    // Si pasaron más de 24h y el lead no compró, agregar a recordatorios pendientes
    const leadBought = await db.query(`
      SELECT 1 FROM subscription_payments
      WHERE created_at > $1
      LIMIT 1
    `, [visited_at]);

    if (!leadBought.rows.length) {
      await redis.set(`reminder:pending:${session_id}`, JSON.stringify(reminder), 'EX', 604800);
    }

    await redis.lrem('queue:pending_reminders', 1, reminder);
  }
});
```

---

## 12. Testing

### 12.1 Unit Tests

```typescript
// tests/unit/sales-patterns-analyzer.test.ts
describe('detectIntent', () => {
  it('detects pricing_question for precio queries', () => {
    expect(detectIntent('Cuánto cuesta el plan?')).toBe('pricing_question');
    expect(detectIntent('precios de los planes')).toBe('pricing_question');
  });

  it('detects checkout_intent for purchase queries', () => {
    expect(detectIntent('Quiero comprar el plan')).toBe('checkout_intent');
    expect(detectIntent('cómo puedo pagar?')).toBe('checkout_intent');
  });
});

// tests/unit/rebecca-chat.test.ts
describe('truncateToLimit', () => {
  it('truncates long messages at sentence boundary', () => {
    const long = 'Este es un mensaje largo. Con muchas oraciones. Que debería ser truncada.';
    expect(truncateToLimit(long, 30)).toBe('Este es un mensaje largo.');
  });
});
```

### 12.2 Integration Tests

```typescript
// tests/integration/widget-api.test.ts
it('accepts context field and stores it', async () => {
  const response = await request(app)
    .post('/api/chat/widget')
    .send({
      session_id: 'test-session',
      message: 'Hola',
      history: [],
      context: { page_url: '/demo', source: 'demo' }
    });

  expect(response.status).toBe(200);
  // Verificar que se guardó en lead_messages con metadata
});
```

---

## 13. Rollout Plan

### Fase 1: Enlaces + Respuestas Cortas (Semana 1)
- [ ] Nueva tabla `sales_patterns`
- [ ] Actualizar endpoint `/api/chat/widget` con `context`
- [ ] Configurar `max_output_tokens` por canal
- [ ] Enriquecer system prompt con enlaces

### Fase 2: Detección de Página (Semana 2)
- [ ] Actualizar `ChatWidget.tsx` para pasar `page_url`
- [ ] Endpoint `/api/chat/track-page`
- [ ]Prompt dinámico por página

### Fase 3: Recordatorios (Semana 3)
- [ ] Redis keys para tracking
- [ ] Cron job reminder processor
- [ ] Integración en Rebecca prompt

### Fase 4: Aprendizaje (Semana 4)
- [ ] Cron job sales patterns analyzer
- [ ] Upsert automático a `lookitry_knowledge`
- [ ] Métricas y dashboard

---

## 14. Métricas de Éxito

| Métrica | Baseline | Target | Cómo se mide |
|---------|----------|--------|--------------|
| Tasa de conversión demo → compra | TBD | +20% | Ratio leads en /demo que compran |
| CTR en enlaces compartidos | N/A | >60% | Clicks en enlaces / plans / checkout |
| Respuesta avg length | ~500 chars | <150 chars | `avg(length(reply))` en logs |
| Leads con recordatorio | N/A | >30% | Leads que reciben mensaje de recordatorio y responden |

---

## 15. Appendix: Enlaces Hardcodeados

```typescript
const LINKS = {
  plans: 'https://lookitry.com/plans',
  checkout: 'https://lookitry.com/checkout',
  demo: 'https://lookitry.com/demo',
  faq: 'https://lookitry.com/plans#faq',
  howItWorks: 'https://lookitry.com/how-it-works',
  contact: 'https://lookitry.com/contact'
};
```

Future: estos enlaces se pueden volver dinámicos por brand via `brands.social_links`.

---

**Documento creado:** 2026-05-17
**Autor:** Sam + Sammy
**Review:** Pendiente