# Guía de Integración: n8n ↔ Lookitry Blog

Esta guía deja alineado el contrato real entre Lookitry y el flujo de n8n que genera artículos.

## 1. Flujo actual

- `POST /api/blog/settings/trigger`: disparo manual desde el panel admin.
- `backend/src/jobs/blog.job.ts`: disparo automático por cron.
- `POST /api/blog/webhook`: publicación del artículo desde n8n hacia Lookitry.
- `POST /api/blog/upload`: subida de imágenes desde n8n hacia Lookitry.

## 2. Autenticación correcta

Hay dos autenticaciones distintas y no deben mezclarse:

### Trigger de n8n

El webhook `trigger-blog-generation` en n8n está protegido por la autenticación propia del nodo `Webhook Trigger`.

- Lookitry ahora intenta varios esquemas compatibles desde `backend/src/utils/blogWebhook.ts`.
- Si el secreto se guarda como `basic:usuario:clave`, el backend enviará `Authorization: Basic ...`.
- Si se guarda como `bearer:token`, el backend enviará `Authorization: Bearer ...`.
- Si se guarda un valor simple, el backend probará `x-n8n-secret`, `x-blog-secret`, `Authorization` y `Bearer`.

Recomendación operativa:

- Para n8n con `headerAuth`, guarda el secreto en `blog_settings.webhook_secret` usando un formato explícito, por ejemplo `bearer:...` o `basic:usuario:clave`.
- Evita asumir que `x-blog-secret` sirve para disparar n8n. Ese header es para la publicación hacia Lookitry, no para despertar el workflow.

### Publicación y uploads hacia Lookitry

Estos dos endpoints sí validan el secreto del blog en Lookitry:

- `POST https://api.lookitry.com/api/blog/webhook`
- `POST https://api.lookitry.com/api/blog/upload`

Headers requeridos:

```http
x-blog-secret: <BLOG_WEBHOOK_SECRET>
```

## 3. Endpoints recomendados en n8n

### Nodo: `Publicar en Lookitry`

- Method: `POST`
- URL: `https://api.lookitry.com/api/blog/webhook`
- Headers:
  - `x-blog-secret: <BLOG_WEBHOOK_SECRET>`
  - `Content-Type: application/json`

### Nodo: `Uploader`

- Method: `POST`
- URL: `https://api.lookitry.com/api/blog/upload`
- Headers:
  - `x-blog-secret: <BLOG_WEBHOOK_SECRET>`
- Body: `multipart/form-data`

## 4. Consumo de posts existentes

El frontend ya no debe consultar Supabase directo desde el navegador para el listado público.

Usa estas rutas internas:

- `GET https://lookitry.com/api/blog`
- `GET https://lookitry.com/api/blog/categories`

Si el workflow de n8n necesita leer posts publicados, puede usar:

- `GET https://lookitry.com/api/blog`

El formato esperado es:

```json
{
  "ok": true,
  "data": []
}
```

No uses transformaciones heredadas de WordPress como:

- `title.rendered`
- `link`
- tags numéricos tipo `93, 90, 87`

En Lookitry los tags son strings.

## 5. Validación operativa

1. Verifica que `blog_settings.webhook_url` apunte al webhook activo de n8n.
2. Verifica que `blog_settings.webhook_secret` esté en un formato compatible con la auth real del nodo de n8n.
3. Ejecuta el trigger manual desde `/admin/blog`.
4. Revisa en el panel:
   - último error
   - modo de autenticación detectado
   - último disparo exitoso
5. Confirma que el artículo aparezca en `/blog`.

## 6. Notas de seguridad

- Las rutas `/api/blog/settings*` deben permanecer protegidas con auth admin.
- El backend no debe devolver `webhook_secret` al cliente.
- No embebas secretos productivos en templates públicos del workflow.
