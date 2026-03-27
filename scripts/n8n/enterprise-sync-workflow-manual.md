# Lookitry Enterprise Sync - Manual n8n Setup

Esta guía deja `The Sync` funcional con un enfoque `node-first`, usando solo un nodo de código central para soportar `CSV`, `API JSON` y `WooCommerce REST` sin depender de credenciales propietarias dentro del repo.

## Variables recomendadas en n8n

- `SUPABASE_URL=https://tu-proyecto.supabase.co`
- `SUPABASE_SERVICE_KEY=tu_service_role_key`
- `LOOKITRY_API_URL=https://api.lookitry.com`
- `ENTERPRISE_SYNC_TOKEN=tu_token_compartido_enterprise_sync`

## Flujo recomendado

1. `Webhook`
2. `Respond to Webhook`
3. `Code`

El `Webhook` recibe la orden del backend, el `Code` procesa todo el catálogo y actualiza el estado, y `Respond to Webhook` devuelve el resumen al backend/admin.

## Nodo 1: Webhook

- `Name`: `Enterprise Sync Trigger`
- `HTTP Method`: `POST`
- `Path`: `enterprise-sync`
- `Response Mode`: `Using 'Respond to Webhook' node`

## Nodo 2: Code

- `Name`: `Process Enterprise Catalog`
- `Language`: `JavaScript`
- `Mode`: `Run Once for All Items`

Usa este código:

```javascript
const payload = ($json.body && Object.keys($json.body).length > 0) ? $json.body : $json;
const {
  brand_id,
  sync_type = 'csv',
  source_url,
  api_key,
  field_map = {},
} = payload;

if (!brand_id || !source_url) {
  throw new Error('brand_id y source_url son requeridos');
}

const syncToken = $env.ENTERPRISE_SYNC_TOKEN || '';
const apiBase = ($env.LOOKITRY_API_URL || 'https://api.lookitry.com').replace(/\/$/, '');
const productWebhookUrl = `${apiBase}/api/enterprise/sync-product`;
const syncStatusUrl = `${apiBase}/api/admin/enterprise/${brand_id}/sync-status`;

if (!syncToken) {
  throw new Error('ENTERPRISE_SYNC_TOKEN no está configurado en n8n');
}

const catalogHeaders = {};
if (api_key) {
  catalogHeaders.Authorization = `Bearer ${api_key}`;
}

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function parseCsv(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return headers.reduce((acc, header, index) => {
      acc[header] = values[index] ?? '';
      return acc;
    }, {});
  });
}

function extractCollection(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.products)) return data.products;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.data)) return data.data;
  return [];
}

function pick(record, target, fallbacks = []) {
  const mappedKey = field_map[target];
  const keys = [mappedKey, target, ...fallbacks].filter(Boolean);

  for (const key of keys) {
    const value = record?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value;
    }
  }

  return null;
}

const catalogResponse = await fetch(source_url, {
  method: 'GET',
  headers: catalogHeaders,
});

if (!catalogResponse.ok) {
  throw new Error(`No se pudo consultar el catálogo: ${catalogResponse.status} ${catalogResponse.statusText}`);
}

const rawBody = await catalogResponse.text();
let records = [];

if (sync_type === 'csv' || /(^|\n).+,.+(\n|$)/.test(rawBody)) {
  records = parseCsv(rawBody);
} else {
  const parsed = JSON.parse(rawBody);
  records = extractCollection(parsed);
}

const normalizedProducts = records
  .map((record) => ({
    brand_id,
    external_id: pick(record, 'external_id', ['id', 'sku', 'product_id']),
    name: pick(record, 'name', ['title', 'product_name']),
    description: pick(record, 'description', ['body_html', 'details', 'short_description']),
    category: pick(record, 'category', ['type', 'product_type', 'collection']),
    image_url: pick(record, 'image_url', ['image', 'image_src', 'imageUrl', 'featured_image', 'images.0.src']),
    price: pick(record, 'price', ['regular_price', 'sale_price']),
  }))
  .filter((product) => product.name && product.image_url);

let successCount = 0;
let failedCount = 0;
const failures = [];

for (const product of normalizedProducts) {
  try {
    const response = await fetch(productWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${syncToken}`,
      },
      body: JSON.stringify(product),
    });

    if (!response.ok) {
      const detail = await response.text();
      failedCount += 1;
      failures.push(`${product.name}: ${detail}`);
      continue;
    }

    successCount += 1;
  } catch (error) {
    failedCount += 1;
    failures.push(`${product.name}: ${error.message}`);
  }
}

const finalStatus = successCount > 0 && failedCount === 0
  ? 'success'
  : successCount > 0
    ? 'partial'
    : 'failed';

const finalMessage = failedCount > 0
  ? failures.slice(0, 3).join(' | ')
  : `Sync completado con ${successCount} productos.`;

await fetch(syncStatusUrl, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${syncToken}`,
  },
  body: JSON.stringify({
    status: finalStatus,
    message: finalMessage,
    products_synced_count: successCount,
  }),
});

return [{
  json: {
    ok: failedCount === 0,
    brand_id,
    sync_type,
    source_url,
    status: finalStatus,
    products_received: records.length,
    products_synced_count: successCount,
    failed_count: failedCount,
    failures: failures.slice(0, 10),
  },
}];
```

## Nodo 3: Respond to Webhook

- `Name`: `Respond to Webhook`
- `Respond With`: `JSON`
- `Response Body`: `={{ $json }}`

## URL final del workflow

Cuando actives el workflow, la URL esperada es:

```text
https://n8n.wilkiedevs.com/webhook/enterprise-sync
```

Esa es la misma que debe quedar configurada en el backend:

- `N8N_ENTERPRISE_SYNC_WEBHOOK_URL=https://n8n.wilkiedevs.com/webhook/enterprise-sync`

## Backend que debe existir

Este flujo asume que ya están disponibles:

- `POST /api/enterprise/sync-product`
- `PATCH /api/admin/enterprise/:brandId/sync-status`
- `ENTERPRISE_SYNC_TOKEN` igual en backend y n8n

## Importable

También dejé una versión JSON lista para importar en:

- `scripts/n8n/enterprise-sync-workflow.json`
