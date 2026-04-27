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
- **URL**: `https://n8n.wilkiedevs.com/webhook/descriptor` (ID: ZjVTV3QxoPEi60GX)
- **Controller**: `products.controller.ts`
- **Funcion**: Analiza la imagen del producto y genera una descripcion tecnica y de marketing automatica.

### 3. Enterprise Sync
- **URL**: `/webhook/enterprise-sync`
- **Controller**: `enterprise.controller.ts`
- **Funcion**: Sincroniza catalogos masivos para clientes corporativos.

### 4. Blog Topic Generator
- **URL**: `/webhook/trigger-topic-generator` (ID: ryoA7wq7WhXYUckC)
- **Trigger**: Manual + Schedule (Lunes 8am)
- **Funcion**: Google Noticias RSS → AI Trend Hunter → Deduplicar → INSERT blog_topics

### 5. Blog Article Producer
- **URL**: `/webhook/trigger-article-producer` (ID: VMAu93Zx4k5qgzdm)
- **Trigger**: Manual
- **Funcion**: Obtiene topic pending → Investiga con Jina → Redacta con Gemini → Guarda draft

### 6. Blog Image Generator
- **URL**: `/webhook/lookitry-blog-images` (ID: l4Mb3wMfHUnsbEXH)
- **Trigger**: Por Article Producer
- **Funcion**: Genera 4 imagenes con Replicate (FLUX Schnell) → Sube a MinIO

### 7. Project Knowledge RAG
- **URL**: `/webhook/project-knowledge-rag`
- **Funcion**: Sincroniza documentacion del proyecto para embeddings RAG

### 8. Feedback Embedding
- **Trigger**: Asincrono via n8n
- **Funcion**: Genera embeddings de feedback para el motor RAG

### 9. NotebookLM Drive Sync
- **URL**: `/webhook/notebooklm-sync`
- **Funcion**: Sincroniza archivos .md a Google Drive para research manual

## Logica de Reintento y Timeout
- El `N8nClient` tiene un timeout global de **90 segundos**.
- Se capturan errores HTTP (50x) para marcar la generacion como `FAILED` en Supabase y notificar al usuario.

## n8n Task Runner - PROBLEMA CONOCIDO
- **Sintoma**: n8n consume 600-800% CPU en loop infinito
- **Error**: "Task runner connection attempt failed: invalid or expired grant token"
- **Causa**: Task Runner embebido en n8n v2.x no se puede deshabilitar facilmente
- **Workflows problematicos**: AI Marketing Report, Scrape Business Emails
