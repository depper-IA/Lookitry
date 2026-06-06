# GCP Setup — Vertex AI (Nano Banana) + MobileSAM para Try-On

Guía para configurar el pipeline de Try-On de Lookitry. El pipeline real usa:

1. **Máscara — MobileSAM** corriendo como servicio local (`sam-service/`, Docker, puerto 8000). NO requiere un Vertex AI Endpoint.
2. **Generación — Nano Banana (Gemini 2.5 Flash Image, `gemini-2.5-flash-image`)** en Vertex AI.
3. **Fallback — n8n** cuando Vertex falla o está deshabilitado.

---

## 1. Autenticación y Configuración Inicial

```bash
# Instalar Google Cloud CLI
curl https://sdk.cloud.google.com | bash
gcloud init

# Autenticar con el proyecto
gcloud auth login
gcloud auth application-default login

# Configurar el proyecto
gcloud config set project VERTEX_PROJECT_ID
gcloud config set region us-central1
```

---

## 2. Servicio de Máscara — MobileSAM local (`sam-service/`)

La segmentación de la silueta se hace con **MobileSAM** (`mobile_sam.pt`, ~39 MB) en un microservicio Python/FastAPI que corre en Docker. No usa GPU ni un Vertex Endpoint.

```bash
# Construir y levantar el servicio (ver sam-service/README.md)
cd sam-service
docker build -t lookitry-sam-local .
docker run -p 8000:8000 lookitry-sam-local

# El servicio expone POST /predict y descarga el peso del modelo en el primer arranque
```

El backend lo invoca mediante la variable `SAM_LOCAL_URL` (p. ej. `http://sam-service:8000`).

---

## 3. Configurar IAM para el Service Account

El backend necesita permisos para invocar la API de Vertex AI (Nano Banana).

```bash
# Crear o usar un service account existente
SERVICE_ACCOUNT="lookitry-backend@tu-project.iam.gserviceaccount.com"
PROJECT_ID="tu-project-id"

# Asignar rol de usuario de Vertex AI
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/aiplatform.user"

# Verificar permisos
gcloud projects get-iam-policy $PROJECT_ID \
  --filter="bindings.serviceAccount:$SERVICE_ACCOUNT"
```

---

## 4. Configurar Variables de Entorno en el Backend

```bash
# .env del backend

# GCP Project y Region
VERTEX_PROJECT_ID="tu-project-id"
VERTEX_LOCATION="us-central1"

# MobileSAM local (servicio de máscara)
SAM_LOCAL_URL="http://sam-service:8000"

# Timeout en ms (25 segundos)
VERTEX_TIMEOUT_MS="25000"

# Auth — API key de GCP (o dejar vacío para ADC)
GOOGLE_API_KEY=""

# Habilitar Vertex AI / Nano Banana (false = usar solo n8n)
VERTEX_AI_ENABLED="true"
```

El modelo de generación está fijado a `gemini-2.5-flash-image` (Nano Banana) en el código (`backend/src/services/vertex-ai.service.ts`); no se configura por variable de entorno.

---

## 5. Verificar la Generación

```bash
# Test del servicio de máscara local
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{ "image": "BASE64_IMAGE_DATA" }'

# Test de acceso a Vertex AI (Nano Banana)
curl -X POST \
  -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" \
  -H "Content-Type: application/json" \
  "https://aiplatform.googleapis.com/v1/projects/tu-project-id/locations/us-central1/publishers/google/models/gemini-2.5-flash-image:generateContent" \
  -d '{ "contents": [{ "parts": [{ "text": "ping" }] }] }'
```

---

## 6. Monitoreo y Logs

```bash
# Ver logs de Vertex AI
gcloud logging read \
  "resource.type=aiplatform.googleapis.com/Endpoint OR resource.type=audited_resource" \
  --project=$PROJECT_ID \
  --limit=50

# Métricas en Cloud Monitoring → Vertex AI
```

---

## Resumen de Variables Críticas

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VERTEX_PROJECT_ID` | ID del proyecto de GCP | `gen-lang-client-0591001769` |
| `VERTEX_LOCATION` | Región | `us-central1` |
| `SAM_LOCAL_URL` | URL del servicio MobileSAM local | `http://sam-service:8000` |
| `VERTEX_AI_ENABLED` | Activar pipeline Vertex (Nano Banana) | `true` / `false` |
| `GOOGLE_API_KEY` | API key para auth (o vacío para ADC) | `AIza...` |

---

## Rollback Rápido

Si el pipeline de Vertex falla en producción:

```bash
# Deshabilitar Vertex AI
export VERTEX_AI_ENABLED=false

# El backend volverá a usar n8n directamente
```

No se requiere restart del backend — la variable se lee en cada request.
