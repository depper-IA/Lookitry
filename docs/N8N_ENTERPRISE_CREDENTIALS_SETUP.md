# Guía: Configurar Enterprise Sync en n8n (Versión Gratuita)

## Paso 1: Crear Credenciales en n8n

Ve a **Configuración → Credenciales** y crea estas 3 credenciales:

### 1.1 Enterprise Sync Token (httpBearerAuth)
- **Nombre:** Enterprise Sync Token
- **Tipo:** Bearer Token Authentication
- **Token:** `lookitry_enterprise_sync_2026_03_27_WilkieSecure`

### 1.2 RemoveBG API (httpHeaderAuth)
- **Nombre:** RemoveBG API
- **Tipo:** Header Authentication
- **Header Name:** `X-Api-Key`
- **Header Value:** `***REMOVED-SECRET***`

### 1.3 Supabase Service (httpBasicAuth)
- **Nombre:** Supabase Service
- **Tipo:** Basic Authentication  
- **Usuario:** `service_role`
- **Contraseña:** `***REMOVED-SECRET***`

### 1.4 MinIO Credentials (no es necesario - los valores se hardcodean en el nodo Code)

---

## Paso 2: Modificar el Workflow

Abre el workflow "Lookitry Enterprise Sync" y haz estos cambios:

### 2.1 Nodo "Load Sync Configs"
Cambiar la configuración para usar la credencial de Supabase:
- **Authentication:** Basic Auth
- **Credential:** Supabase Service

Y actualizar la URL:
```
https://vkdooutklowctuudjnkl.supabase.co/rest/v1/enterprise_sync_configs?active=eq.true&select=*
```

### 2.2 Nodo "Update Sync Status" (HTTP Request)
Cambiar:
- **Authentication:** Bearer Token Auth
- **Credential:** Enterprise Sync Token
- **URL:** `https://api.lookitry.com/api/admin/enterprise/{{$json.brand_id}}/sync-status`

### 2.3 Nodo "Process Brand Catalog" (Code)
Reemplazar todo el código JavaScript con esta versión que usa valores hardcodeados:

```javascript
const crypto = require('crypto');

const config = $json;
const {
  brand_id,
  sync_type = 'csv',
  source_url,
  api_key,
  field_map = {},
} = config;

if (!brand_id || !source_url) {
  throw new Error('brand_id y source_url son requeridos');
}

// VALORES HARDCODADOS (configurados manualmente)
const apiBase = 'https://api.lookitry.com';
const enterpriseToken = 'lookitry_enterprise_sync_2026_03_27_WilkieSecure';
const removeBgApiKey = '***REMOVED-SECRET***';
const minioEndpoint = 'https://minio.wilkiedevs.com';
const minioBucket = 'images';
const minioAccessKey = 'Wilkiedevs';
const minioSecretKey = 'Travis2305*';
const minioPublicUrl = 'https://minio.wilkiedevs.com';

// ... (resto del código igual que antes)
```

---

## Paso 3: Activar el Workflow

1. Guarda los cambios
2. Activa el workflow (toggle en la esquina superior derecha)
3. Ejecuta una prueba manual

---

## Notas de Seguridad

⚠️ **Importante:** En n8n gratuito, las credenciales se almacenan encriptadas pero cualquier persona con acceso al workflow puede verlas. Considera:
- Limitar quién tiene acceso al workflow
- Usar tokens con permisos limitados
- Eventualmente actualizar a n8n Pro para usar Variables de Entorno

---

## Solución de Problemas

### Error: "ENTERPRISE_SYNC_TOKEN no está configurado"
→ Verifica que el token está hardcodeado en el nodo Code

### Error: "remove.bg falló"
→ Verifica que la API key de RemoveBG está correcta

### Error: "MinIO upload falló"
→ Verifica las credenciales de MinIO

### Error 401 en sync-status
→ El token no coincide - verifica que sea exactamente: `lookitry_enterprise_sync_2026_03_27_WilkieSecure`
