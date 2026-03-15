---
inclusion: manual
---

# Guía de uso de Context7 (optimización de tokens)

Context7 provee documentación actualizada de librerías directamente en contexto.
Úsalo con criterio para no desperdiciar tokens disponibles.

## Cuándo usar Context7

- Cuando necesites la API exacta de una librería (Next.js, Supabase, n8n, etc.)
- Cuando el comportamiento de una función no está claro por el código existente
- Cuando hay un error que podría ser de versión o de API desactualizada

## Cuándo NO usar Context7

- Para conceptos generales de TypeScript/React que ya conoces
- Para patrones que ya están implementados en el proyecto (lee el código existente primero)
- Para preguntas que se pueden responder leyendo el código del repo

## Cómo usarlo eficientemente

1. Primero usa `resolve-library-id` con el nombre exacto de la librería
2. Luego usa `query-docs` con una pregunta MUY específica — no preguntas amplias
3. Limita el topic al método o feature puntual que necesitas

## Librerías relevantes del proyecto (IDs verificados)

| Librería | Context7 ID | Notas |
|---|---|---|
| Next.js | `/vercel/next.js` | App Router, Server Components, middleware |
| Supabase | `/supabase/supabase` | Auth, RLS, queries, storage |
| n8n (docs oficiales) | `/n8n-io/n8n-docs` | API REST, nodos, webhooks, expresiones — 1149 snippets, reputación alta |
| n8n (código fuente) | `/n8n-io/n8n` | Internals, tipos TypeScript — usar si docs no alcanza |
| n8n (llms full) | `/llmstxt/n8n_io_llms-full_txt` | Máxima cobertura, 25K snippets — solo si los anteriores no tienen lo que buscas |

### n8n — queries útiles para este proyecto

- API REST PUT workflow: `n8n REST API update workflow nodes PUT /workflows/{id}`
- Expresiones en nodos HTTP: `n8n HTTP Request node body expressions JSON.stringify`
- Webhook response node: `n8n Respond to Webhook node response body`
- Settings válidos en API: `n8n workflow settings schema executionOrder callerPolicy`

## Ejemplo de query eficiente

MAL: "cómo funciona Next.js"
BIEN: "Next.js App Router middleware matcher config para rutas protegidas"
