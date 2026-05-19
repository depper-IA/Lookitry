# GCP Setup — Vertex AI Endpoint para SAM 2 + Imagen 3

Guía paso a paso para desplegar SAM 2 en un Vertex AI Endpoint y configurar Imagen 3 (Nano Banana 2) para el pipeline de Try-On de Lookitry.

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

## 2. Preparar el Modelo SAM 2 para Vertex AI

SAM 2 (Segment Anything Model 2) necesita ser convertido a formato de Vertex AI para desplegarlo en un Endpoint.

### Opción A: Desplegar SAM 2 desde Model Garden

1. Ir a [Vertex AI Model Garden](https://console.cloud.google.com/vertex-ai/model-garden)
2. Buscar "SAM 2" (Segment Anything Model 2)
3. Seleccionar "Deploy to Endpoint"
4. Configurar:
   - **Machine type**: `n1-standard-4` con GPU NVIDIA T4
   - **Accelerator**: GPU T4 (para inferencia rápida)
   - ** replicas**: 1 (escalar según demanda)

### Opción B: Convertir modelo custom a Vertex AI

Si tienes el modelo en local o GCS:

```bash
# Subir modelo a GCS
gsutil cp -r ./sam2-model gs://YOUR_BUCKET/sam2/

# Crear modelo en Vertex AI
gcloud ai models upload \
  --display-name="sam2-segmenter" \
  --container-model-format=saved_model \
  --container-image-uri=us-docker.pkg.dev/vertex-ai/prediction/tf2-cpu.2-8:latest \
  --artifact-uri=gs://YOUR_BUCKET/sam2/

# Esperar que el modelo esté listo
gcloud ai models list
```

---

## 3. Crear el Endpoint para SAM 2

```bash
# Variables
SAM2_MODEL_NAME="sam2-segmenter-v1"
SAM2_ENDPOINT_NAME="sam2-tryon-endpoint"
LOCATION="us-central1"
PROJECT_ID="tu-project-id"

# 1. Crear endpoint
gcloud ai endpoints create \
  --display-name="$SAM2_ENDPOINT_NAME" \
  --location=$LOCATION

# Obtener el ID del endpoint
ENDPOINT_ID=$(gcloud ai endpoints list \
  --filter="displayName=$SAM2_ENDPOINT_NAME" \
  --format="value(name)" | head -1)

echo "Endpoint ID: $ENDPOINT_ID"

# 2. Desplegar modelo al endpoint (ejemplo con T4)
gcloud ai endpoints deploy-model $ENDPOINT_ID \
  --model=$SAM2_MODEL_NAME \
  --display-name="sam2-production" \
  --machine-type=n1-standard-4 \
  --accelerator=type=nvidia-t4,count=1 \
  --traffic-split=100
```

---

## 4. Configurar IAM para el Service Account

El backend necesita permisos para invocar el endpoint de Vertex AI.

```bash
# Crear o usar un service account existente
SERVICE_ACCOUNT="lookitry-backend@tu-project.iam.gserviceaccount.com"

# Asignar rol de invocador de endpoints
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/aiplatform.endpointInvoker"

# Verificar permisos
gcloud projects get-iam-policy $PROJECT_ID \
  --filter="bindings.serviceAccount:$SERVICE_ACCOUNT"
```

---

## 5. Configurar Variables de Entorno en el Backend

```bash
# .env del backend

# GCP Project y Region
VERTEX_PROJECT_ID="tu-project-id"
VERTEX_LOCATION="us-central1"

# SAM 2 Endpoint (reemplazar con el ID real)
VERTEX_SAM2_ENDPOINT="https://us-central1-aiplatform.googleapis.com/v1/projects/tu-project-id/locations/us-central1/endpoints/123456789"

# Imagen 3 (Nano Banana 2) — modelo GA
VERTEX_IMAGEN_MODEL="imagen-3.0-generate-002"

# Timeout en ms (25 segundos)
VERTEX_TIMEOUT_MS="25000"

# Auth — API key de GCP (o dejar vacío para ADC)
GOOGLE_API_KEY=""

# Habilitar Vertex AI (false = usar solo n8n)
VERTEX_AI_ENABLED="false"
```

---

## 6. Verificar el Endpoint

```bash
# Test de conexión al endpoint
curl -X POST \
  -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" \
  -H "Content-Type: application/json" \
  https://us-central1-aiplatform.googleapis.com/v1/projects/tu-project-id/locations/us-central1/endpoints/123456789:predict \
  -d '{
    "instances": [{
      "image": {"bytesBase64Encoded": "BASE64_IMAGE_DATA"}
    }],
    "parameters": {
      "confidenceThreshold": 0.5,
      "maskBase64": true
    }
  }'
```

---

## 7. Monitoreo y Logs

```bash
# Ver logs del endpoint
gcloud logging read \
  "resource.type=aiplatform_endpoint" \
  --project=$PROJECT_ID \
  --limit=50

# Métricas en Cloud Monitoring
# Vertex AI → Endpoints → tu-endpoint-id → Metrics
#   - predict_request_count
#   - predict_request_latency
#   - prediction_backend_error_count
```

---

## 8. Escalar el Endpoint

```bash
# Escalar a más replicas durante horas pico
gcloud ai endpoints update $ENDPOINT_ID \
  --location=$LOCATION \
  --min-replica-count=1 \
  --max-replica-count=3

# Actualizar tipo de máquina si necesito más GPU
gcloud ai endpoints deploy-model $ENDPOINT_ID \
  --model=$SAM2_MODEL_NAME \
  --display-name="sam2-highmem" \
  --machine-type=n1-highmem-4 \
  --accelerator=type=nvidia-t4,count=1 \
  --traffic-split=0  # Sin tráfico mientras probamos
```

---

## Resumen de Variables Críticas

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VERTEX_PROJECT_ID` | ID del proyecto de GCP | `gen-lang-client-0591001769` |
| `VERTEX_LOCATION` | Región del endpoint | `us-central1` |
| `VERTEX_SAM2_ENDPOINT` | URL completa del endpoint | `https://.../endpoints/123456789:predict` |
| `VERTEX_IMAGEN_MODEL` | Modelo de Imagen 3 | `imagen-3.0-generate-002` |
| `VERTEX_AI_ENABLED` | Activar pipeline Vertex | `true` / `false` |
| `GOOGLE_API_KEY` | API key para auth (o vacío para ADC) | `AIza...` |

---

## Rollback Rápido

Si el pipeline de Vertex falla en producción:

```bash
# Deshabilitar Vertex AI
export VERTEX_AI_ENABLED=false

# El backend volverá a usar n8n directamente
# (comportamiento original, sin cambios en el código)
```

No se requiere restart del backend — la variable se lee en cada request.