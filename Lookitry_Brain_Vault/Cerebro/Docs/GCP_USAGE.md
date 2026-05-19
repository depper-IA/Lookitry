# Uso de Google Cloud Platform (GCP) — Lookitry

**Proyecto GCP:** `gen-lang-client-0591001769`
**Región principal:** `us-central1`
**Programa:** Google for Startups

---

## Resumen Ejecutivo

Lookitry utiliza activamente Google Cloud Platform como infraestructura central de IA. Los modelos de Google Vertex AI potencian las dos funciones de IA más críticas del producto: el Try-On virtual de ropa y la generación de imágenes del blog editorial. Adicionalmente, Gemini se usa para embeddings RAG y descripción automática de productos.

---

## 1. Try-On Virtual de Ropa (Core Feature)

**Modelo:** `gemini-2.5-flash-image` vía Vertex AI  
**Workflow:** n8n → `aiplatform.googleapis.com` → MinIO  
**Volumen:** Cada generación de usuario final pasa por Vertex

**Flujo técnico:**
```
Usuario sube selfie
→ Backend Node.js — SAM Local genera máscara de silueta
→ n8n Webhook (lookitry-blog-images workflow)  
→ Vertex AI Gemini 2.5 Flash Image (generación inpainting)
→ Imagen resultado guardada en MinIO
→ Usuario ve resultado en < 30s
```

**Segmentación (SAM):** MobileSAM corriendo en VPS propio genera la máscara de persona antes de enviar a Vertex, mejorando la calidad del try-on.

---

## 2. Generación de Imágenes para Blog

**Modelo:** `gemini-2.5-flash-image` vía Vertex AI  
**Workflow:** n8n `Lookitry Blog Images-vertex` (activo)  
**Proyecto GCP:** `gen-lang-client-0591001769` / `us-central1`

**Flujo técnico:**
```
Blog Article Producer (n8n) genera prompts de imagen
→ n8n llama Vertex AI directamente con credenciales GCP
→ gemini-2.5-flash-image genera imágenes 16:9
→ Imágenes subidas a backend vía /api/blog/upload
→ Artículo publicado con imágenes generadas
```

---

## 3. Descripción Automática de Productos (AI Descriptor)

**Modelo:** `gemini-2.5-flash` vía `GEMINI_API_KEY`  
**Archivo:** `backend/src/services/ai-descriptor/ai-descriptor.service.ts`  
**Uso:** Cuando brand sube producto sin descripción → Gemini genera descripción estructurada

---

## 4. Embeddings RAG (Knowledge Base)

**Modelo:** `gemini-embedding-004` (768 dimensiones)  
**Archivo:** `backend/src/services/knowledge-embedding.service.ts`  
**Uso:** Base de conocimiento de Sammantha (agente IA). Documentos → embeddings → pgvector en Supabase

---

## 5. Vertex AI — API General (Chat / Generación)

**Modelo:** `gemini-2.5-flash` y otros  
**Archivo:** `backend/src/services/vertex.service.ts`  
**Endpoints:** `/api/vertex/generate`, `/api/vertex/stream`  
**Uso:** Generación de contenido general, respuestas del agente Sammantha

---

## 6. Google Sign-In (OAuth)

**Uso:** Login alternativo para usuarios y brands  
**Credencial:** Google OAuth Client ID

---

## 7. Google Analytics (GA4)

**Uso:** Métricas de tráfico y conversión en landing y app

---

## 8. GCS (Google Cloud Storage) — Disponible, No Activo

**Estado:** Código listo en `backend/src/services/upload.service.ts`  
**Activación:** Requiere `gcs-credentials.json` en `/root/virtual-tryon/credentials/`  
**Bucket:** `lookitry-vertex`  
**Por qué inactivo:** MinIO cubre el almacenamiento actual. GCS se activaría si se necesita URL pública para Vertex Imagen 3 (inpainting directo desde GCP sin pasar por n8n).

---

## Variables de Entorno GCP

```env
VERTEX_PROJECT_ID=gen-lang-client-0591001769
VERTEX_LOCATION=us-central1
GEMINI_API_KEY=...          # Gemini REST API
GOOGLE_API_KEY=...          # Google APIs generales
VERTEX_AI_API_KEY=...       # Vertex AI específico
GOOGLE_APPLICATION_CREDENTIALS=/app/credentials/gcs-credentials.json  # GCS (inactivo)
```

---

## Estado por Servicio (Mayo 2026)

| Servicio | Modelo | Estado | Vía |
|---|---|---|---|
| Try-On virtual | gemini-2.5-flash-image | ✅ Activo | n8n → Vertex |
| Blog images | gemini-2.5-flash-image | ✅ Activo | n8n → Vertex |
| AI Descriptor | gemini-2.5-flash | ✅ Activo | GEMINI_API_KEY |
| RAG Embeddings | gemini-embedding-004 | ✅ Activo | GEMINI_API_KEY |
| Vertex Chat/Stream | gemini-2.5-flash | ✅ Activo | GEMINI_API_KEY |
| Google Sign-In | OAuth | ✅ Activo | — |
| Google Analytics | GA4 | ✅ Activo | — |
| GCS Storage | — | ⏸ Disponible | Requiere credentials |
| Vertex NanoBanana directo | gemini-2.5-flash-image | ⏸ Disponible | VERTEX_AI_ENABLED=true |
| Vertex SAM2 Endpoint | SAM 2 | ⏸ Disponible | VERTEX_SAM2_ENDPOINT |
