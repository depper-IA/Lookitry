# Integracion n8n - Lookitry

## Descripcion
n8n actua como el motor de orquestacion de flujos de IA y tareas asincronas. El backend se comunica con n8n via HTTP POST utilizando webhooks protegidos.

## Configuracion
- **Base URL**: `https://n8n.wilkiedevs.com`
- **Autenticacion**: Cabecera `Authorization: Bearer ${N8N_BEARER_TOKEN}`

## Webhooks Activos

### 1. Generador de Try-On (Principal)
- **URL**: `https://n8n.wilkiedevs.com/webhook/tryon` (ID: wPLypk7KhBcFLicX)
- **Controller**: `pruebalo.controller.ts`
- **Funcion**: Recibe selfie + producto y retorna la imagen procesada via Replicate/Kling.

### 2. Descriptor de Productos
- **URL**: `https://n8n.wilkiedevs.com/webhook/descriptor`
- **Controller**: `products.controller.ts`
- **Funcion**: Analiza la imagen del producto y genera una descripcion tecnica y de marketing automatica.

### 3. Generador de Blog IA
- **URL**: `https://n8n.wilkiedevs.com/webhook/blog-generator`
- **Controller**: `blog.controller.ts`
- **Funcion**: Genera articulos basados en tendencias de moda y productos de la marca.

### 4. Enterprise Sync
- **URL**: `https://n8n.wilkiedevs.com/webhook/enterprise-sync`
- **Controller**: `enterprise.controller.ts`
- **Funcion**: Sincroniza catalogos masivos para clientes corporativos.

## Logica de Reintento y Timeout
- El `N8nClient` tiene un timeout global de **90 segundos**.
- Se capturan errores HTTP (50x) para marcar la generacion como `FAILED` en Supabase y notificar al usuario.
