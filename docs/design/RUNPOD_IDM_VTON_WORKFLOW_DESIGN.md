# Diseño Técnico: RunPod + IDM-VTON Workflow

**Fecha:** 10 Abril 2026  
**Tipo:** Workflow paralelo de testing (NO afecta flujo actual)  
**Modelo:** IDM-VTON via RunPod Serverless  
**Estado:** Diseño - Sin implementación

---

## 1. Resumen

Sistema de testing para virtual try-on usando **IDM-VTON** (modelo VTON especializado de Intel) corriendo en **RunPod Serverless** (GPU on-demand). Workflow 100% paralelo al actual.

### Objetivos
- Cara 100% preservada (el modelo NO modifica la cara)
- Respeto de tallas/tamaño corporal
- Preservación de marcas/texturas de ropa
- Testing sin límites de rate limiting

### Restricciones
- NO modificar flujo actual de Try-On
- NO afectar generaciones actuales de usuarios

---

## 2. Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO EXISTENTE (NO TOCAR)                  │
│                                                                 │
│  Frontend → Backend → /webhook/tryon → n8n (Gemini) → MinIO   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    NUEVO FLUJO RUNPOD+IDM-VTON                  │
│                                                                 │
│  Frontend → Backend → /webhook/tryon-runpod → n8n → RunPod   │
│                                                    ↓            │
│                                              IDM-VTON (SDXL)   │
│                                                    ↓            │
│                                              MinIO (resultado) │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Por Qué IDM-VTON Preserva la Cara

IDM-VTON está diseñado específicamente para **VTON**, no es un modelo de edición de caras. Funciona así:

1. **Input:** Persona original + Imagen de ropa
2. **Proceso:**
   - Detecta la persona y la ropa existente
   - Solo hace inpainting en la **zona de la ropa** (torso/piernas)
   - La cara y resto del cuerpo se recombinan del original
3. **Output:** Persona con la nueva ropa, cara 100% igual

```
┌─────────────────────────────────────────────────────────────┐
│                    IDM-VTON Pipeline                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   [Persona] ──→ [Preservar cara] ──→ [Preservar cuerpo] │
│        │                                      │             │
│        │                                      │             │
│        ↓                                      ↓             │
│   [Detectar                        [Recombinar             │
│    zona ropa]                         con original]         │
│        │                                      │             │
│        ↓                                      │             │
│   [Inpainting                     [Output final             │
│    solo zona ropa]               cara=cara_original]       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Paper:** https://arxiv.org/abs/2312.01725

---

## 4. Especificaciones de RunPod

### 4.1 Plan Recomendado

| Aspecto | Detalle |
|---------|---------|
| **Tipo** | Serverless (no pagas si no usas) |
| **GPU** | NVIDIA RTX A5000 o similar |
| **vCPU** | 8 |
| **RAM** | 32GB+ |
| **Costo/hora** | ~$0.35-0.45/hora (facturación por segundo) |
| **Costo/imagen** | ~$0.01-0.03 (30-90 segundos por generación) |

### 4.2 Container Image
```dockerfile
# Basado en PyTorch + CUDA
FROM pytorch/pytorch:2.0.1-cuda11.7-cudnn8-runtime

# Dependencias de IDM-VTON
RUN pip install diffusers transformers accelerate scipy

# Modelo IDM-VTON
WORKDIR /app
COPY idm-vton/ ./idm-vton/

# API server (FastAPI)
RUN pip install fastapi uvicorn
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 4.3 API del Container

```python
# /app/main.py (FastAPI)
from fastapi import FastAPI
from pydantic import BaseModel
import base64
import torch
from PIL import Image
import io

app = FastAPI()

# Modelo global (se carga una vez)
pipe = None

@app.on_event("startup")
async def load_model():
    global pipe
    # Cargar IDM-VTON
    pipe = load_idm_vton_model()
    pipe.to("cuda")

class TryOnRequest(BaseModel):
    person_image: str  # base64
    garment_image: str  # base64
    garment_description: str = ""
    seed: int = -1

class TryOnResponse(BaseModel):
    output_image: str  # base64
    mask_image: str  # base64 (opcional)

@app.post("/tryon", response_model=TryOnResponse)
async def tryon(req: TryOnRequest):
    # Decodificar imágenes
    person = Image.open(io.BytesIO(base64.b64decode(req.person_image)))
    garment = Image.open(io.BytesIO(base64.b64decode(req.garment_image)))
    
    # Ejecutar IDM-VTON (preserva cara automáticamente)
    output = pipe.tryon(person, garment, req.garment_description, req.seed)
    
    # Retornar
    return TryOnResponse(
        output_image=base64.b64encode(output).decode(),
        mask_image=base64.b64encode(mask).decode()
    )
```

---

## 5. Workflow n8n

### 5.1 Estructura General

```
Webhook (/webhook/tryon-runpod)
    │
    ├── 1. Validar Input
    │       ├── brand_id, product_id, selfie_url, product_image_url
    │       └── prompt (descripción de ropa)
    │
    ├── 2. Descargar Imágenes
    │       ├── selfie → binary
    │       └── producto → binary
    │
    ├── 3. Convertir a Base64
    │       ├── selfie_base64
    │       └── garment_base64
    │
    ├── 4. Llamar RunPod API
    │       └── POST https://[endpoint].runpod.io/v1/tryon
    │
    ├── 5. Procesar Respuesta
    │       └── Extraer output_image base64
    │
    ├── 6. Convertir a Binary
    │       └── base64 → JPEG binary
    │
    ├── 7. Upload a MinIO
    │       └── Guardar resultado
    │
    ├── 8. Responder
    │       └── { success, imageUrl, _meta }
```

### 5.2 Nodos del Workflow

| Nodo | Tipo | Función |
|------|------|---------|
| `Webhook` | webhook | Recibe requests de testing |
| `Validar Input` | Code | Validar campos requeridos |
| `Descargar Selfie` | HTTP Request | GET selfie_url → binary |
| `Descargar Producto` | HTTP Request | GET product_image_url → binary |
| `Convertir Selfie a Base64` | Code | binary → base64 string |
| `Convertir Garment a Base64` | Code | binary → base64 string |
| `Llamar RunPod API` | HTTP Request | POST /tryon |
| `Extraer Output` | Code | Parsear respuesta |
| `Convertir Output a File` | ConvertToFile | base64 → JPEG |
| `Subir a MinIO` | HTTP Request | POST /api/upload/selfie |
| `Responder` | RespondToWebhook | JSON response |

### 5.3 Payload para RunPod

```json
{
  "person_image": "base64_encoded_selfie",
  "garment_image": "base64_encoded_garment",
  "garment_description": "Vestido azul floral manga larga",
  "seed": -1
}
```

### 5.4 Respuesta de RunPod

```json
{
  "output_image": "base64_encoded_result",
  "mask_image": "base64_encoded_mask"
}
```

---

## 6. Diagrama de Flujo n8n

```
┌──────────────┐
│   Webhook   │  /webhook/tryon-runpod
└──────┬───────┘
       │
┌──────▼───────┐
│ Validar Input │
└──────┬───────┘
       │
       ├──────────────────────────────────┐
       │                                  │
┌──────▼───────┐               ┌─────────▼─────────┐
│ Descargar    │               │  Descargar        │
│ Selfie      │               │  Producto         │
└──────┬───────┘               └─────────┬─────────┘
       │                                  │
       └──────────────┬───────────────────┘
                      │
       ┌──────────────▼──────────────┐
       │ Convertir Selfie a Base64   │
       └──────────────┬──────────────┘
                      │
       ┌──────────────▼──────────────┐
       │ Convertir Garment a Base64  │
       └──────────────┬──────────────┘
                      │
       ┌──────────────▼──────────────┐
       │   Llamar RunPod API        │
       │   POST /tryon              │
       └──────────────┬──────────────┘
                      │
       ┌──────────────▼──────────────┐
       │   Extraer Output Image     │
       └──────────────┬──────────────┘
                      │
       ┌──────────────▼──────────────┐
       │   Convert to File (JPEG)   │
       └──────────────┬──────────────┘
                      │
       ┌──────────────▼──────────────┐
       │   Subir a MinIO            │
       └──────────────┬──────────────┘
                      │
       ┌──────────────▼──────────────┐
       │   Responder Exito          │
       └─────────────────────────────┘
```

---

## 7. Comparativa con Flujo Actual

| Aspecto | Gemini (Actual) | IDM-VTON (RunPod) |
|---------|-----------------|-------------------|
| **Tipo** | Modelo generalista | VTON especializado |
| **Cara** | Puede variar | 100% preservada |
| **Residuos de ropa** | Problema reportado | Resuelto por diseño |
| **Tallas/Obesidad** | Deforma | Preserva cuerpo |
| **Marcas/Texturas** | Variables | IP-Adapter preserva |
| **Costo** | ~$0.05-0.09/img | ~$0.01-0.03/img |
| **Rate limit** | Sí (OpenRouter) | No (GPU propia) |

---

## 8. Variables de Entorno

```bash
# Backend
RUNPOD_API_KEY=rp_xxxxx
RUNPOD_ENDPOINT=https://xxxxx.runpod.io/v1
RUNPOD_TRYON_ENABLED=false  # Flag para testing

# n8n (en workflow)
RUNPOD_API_URL=https://xxxxx.runpod.io/v1/tryon
```

---

## 9. Costos Estimados

### RunPod Serverless Pricing

| Recurso | Costo |
|---------|-------|
| GPU A5000 | $0.35/hr |
| Storage | $0.10/GB |
| Bandwidth | $0.05/GB |

### Cálculo por Imagen

| Fase | Tiempo | Costo |
|------|--------|-------|
| Cold start | 2-5s | ~$0.005 |
| Inference | 30-60s | ~$0.01-0.02 |
| **Total** | **~45s** | **~$0.015-0.025** |

### Comparación

| Solución | Costo/imagen | Rate Limit |
|----------|-------------|-----------|
| Gemini (OpenRouter) | ~$0.07 | Sí |
| IDM-VTON (RunPod) | ~$0.02 | No |
| **Ahorro** | **~71%** | **∞** |

---

## 10. Siguientes Pasos (para implementar)

### Fase 1: Setup RunPod
1. [ ] Crear cuenta RunPod
2. [ ] Subir modelo IDM-VTON a RunPod
3. [ ] Configurar container con FastAPI
4. [ ] Obtener endpoint y API key
5. [ ] Testear manualmente

### Fase 2: Backend
1. [ ] Crear endpoint `/webhook/tryon-runpod`
2. [ ] Implementar proxy que reenvía a RunPod
3. [ ] Agregar variables de entorno

### Fase 3: n8n
1. [ ] Importar workflow JSON
2. [ ] Configurar credenciales
3. [ ] Testear end-to-end

### Fase 4: Testing
1. [ ] Probar con vestidos (residuos de ropa)
2. [ ] Probar con personas obesas (preservación tallas)
3. [ ] Probar con marcas/logo (texturas)
4. [ ] Comparar vs Gemini

---

## 11. Consideraciones Importantes

### 11.1 Cold Start
RunPod serverless tiene cold start de 5-15 segundos. Para evitar esto:
- Usar "minimum instance" que mantenga warm
- O Acceptar cold start en primera request

### 11.2 License de IDM-VTON
**CC BY-NC-SA 4.0** - Solo para investigación
- ✅ Testing gratuito
- ❌ NO comercial sin licensing

Si en el futuro quieres uso comercial:
- Contactar a los autores
- O usar FLUX Fill ($0.05/img, comercial)

### 11.3 Backup/Fallback
El workflow puede incluir fallback a Gemini si RunPod falla:
```json
{
  "fallback": "gemini",
  "fallback_url": "/webhook/tryon"
}
```

---

## 12. Archivos del Diseño

| Archivo | Descripción |
|---------|-------------|
| `docs/design/RUNPOD_IDM_VTON_WORKFLOW_DESIGN.md` | Este documento |
| `docs/design/runpod-idm-vton-workflow.json` | Workflow n8n importable |
| `docs/design/runpod-dockerfile` | Dockerfile para container |
| `docs/design/runpod-requirements.txt` | Dependencias Python |
| `docs/design/runpod-main.py` | FastAPI del container |

### 12.1 Flujo de Implementación en RunPod

```
1. Build Docker image localmente
   docker build -t idm-vton-api -f runpod-dockerfile .

2. Subir a RunPod
   - Crear endpoint serverless en RunPod
   - Subir la imagen docker
   - Obtener endpoint URL

3. Configurar environment variables
   RUNPOD_API_KEY=rp_xxxxx
   RUNPOD_API_URL=https://xxxx.runpod.io/v1/tryon
```

---

## 13. Preguntas Frecuentes

### ¿La cara se preserva 100%?
Sí. IDM-VTON recombina la cara y cuerpo original con la zona de ropa generada. La cara NO se pasa por el modelo de difusión.

### ¿Cuánto cuesta por imagen?
~$0.015-0.025 por imagen (30-90 segundos de GPU a $0.35/hr).

### ¿Puedo apagar cuando no uso?
Sí. RunPod serverless solo cobra cuando hay requests.

### ¿Y si quiero uso comercial?
Necesitas licensing de IDM-VTON (CC BY-NC-SA 4.0) o cambiar a FLUX Fill ($0.05/img, comercial).

---

**Documento de diseño - NO implementar hasta autorización del usuario**
