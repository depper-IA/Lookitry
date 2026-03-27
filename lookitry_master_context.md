# LOOKITRY — MASTER PROJECT CONTEXT DOCUMENT (AUDITED)
> Versión 4.0 (Mar 2026) — Fuente de verdad técnica definitiva basada en auditoría real.

## 1. Identidad y Propósito
**Lookitry** es un SaaS de Probador Virtual (Virtual Try-On) para tiendas de moda en Latinoamérica. Permite a los clientes subir una selfie y previsualizar prendas del catálogo de la marca en segundos.

- **Fase Actual**: Beta Comercial (Estable).
- **Core Value**: Integración "Plug & Play" via Widget/WooCommerce sin necesidad de infraestructura de IA propia por parte del cliente.

## 2. Stack Tecnológico Real
| Capa | Tecnología | Notas |
|------|------------|-------|
| **Frontend** | Next.js 14 | React (App Router), TypeScript, Tailwind CSS. |
| **Backend** | Node.js (Express) | TypeScript. Middleware para JWT, Auth y Error Handling. |
| **DB / Auth** | Supabase | Postgres (Admin Client + Anon Key). JWT custom. |
| **Storage** | MinIO | `minio.wilkiedevs.com` para gestión de imágenes S3. |
| **Pagos** | Wompi + PayPal | Checkout dinámico integrado con el sistema de planes. |
| **IA / Workflow**| n8n | Orquestación externa. Webhook: `wPLypk7KhBcFLicX`. |

## 3. Modelo de Negocio (pricing_config)
Los precios y límites se gestionan **estrictamente** desde la tabla `pricing_config` en Supabase. 

| ID Plan | Precio COP (mes) | Generaciones | Prod. Max | Características Principales |
|---------|------------------|--------------|-----------|-----------------------------|
| **trial**| $20.000 (7 d) | 15 total | 1 | Prueba de valor inicial. |
| **basic**| $180.000 | 400 | 5 | 1 Template Bare, Widget embebible. |
| **pro**  | $350.000 | 1.000 | 15 | +3 Templates, Analytics, Soporte Prioritario. |

- **Add-on Mini-Landing**: Pago único de **$650.000 COP** (vía `payment_settings`).
- **Prorrateo**: Implementado en el backend para upgrades automáticos calculando días restantes.

## 4. Arquitectura de IA y Try-On (Implementación Real)

El sistema de generación es 100% dinámico y utiliza **Gemini** para dos fases críticas:

### Fase 1: Enriquecimiento de Prompt (Backend RAG)
- **Embedding**: `gemini-embedding-001` (vía [PromptRagService](file:///c:/Users/Matt/Lookitry/backend/src/services/prompt-rag.service.ts#25-192)).
- **Refinamiento**: **Gemini 2.0 Flash** reescribe el prompt base incorporando "reglas aprendidas" de fallos previos en `generation_feedback`.

### Fase 2: Generación de Imagen (OpenRouter Engine)
Actualmente implementado en el flujo de n8n utilizando el modelo **`google/gemini-2.5-flash-image`** con soporte nativo de multimodalidad.
- **Payload Técnico (Exacto)**:
```json
{
  "model": "google/gemini-2.5-flash-image",
  "modalities": ["image", "text"],
  "messages": [{
    "role": "user",
    "content": [
      { "type": "text", "text": "$json.full_prompt" },
      { "type": "image_url", "image_url": { "url": "$json.selfie_url" } },
      { "type": "image_url", "image_url": { "url": "$json.product_image_url" } }
    ]
  }],
  "max_tokens": 1024,
  "temperature": 0.3
}
```

### Roadmap Tecnológico (NO IMPLEMENTADO):
- **Segment-Anything (SAM)**: Previsto para masking quirúrgico de fondo y cuerpo.
- **Recraft v3**: Seleccionado como futuro motor de inpainting especializado en fidelidad textil.

## 5. Infraestructura y Despliegue
- **VPS**: Hostinger (Gestión vía SSH/Docker).
- **Deploy**: Script `_deploy_now.py`.
- **Dominios**: `lookitry.com` (Front), `api.lookitry.com` (Backend), `minio.wilkiedevs.com` (Storage), `n8n.wilkiedevs.com` (Workflow).

## 6. Reglas de Desarrollo
1. **Dinamismo**: Nunca harcodear precios. Siempre fetch a `pricing_config`.
2. **Seguridad**: Usar `supabaseAdmin` en el backend.
3. **Caché**: El widget utiliza `brandConfigCache` para optimizar carga.
