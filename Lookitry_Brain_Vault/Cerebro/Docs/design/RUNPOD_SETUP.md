# Setup: RunPod + IDM-VTON Testing

**Fecha:** 10 Abril 2026  
**Estado:** Listo para implementar

---

## Paso 1: Crear Cuenta en RunPod

1. Ir a https://runpod.io
2. Registrarse con email/Google
3. Añadir $10-$20 de saldo (crédito)

---

## Paso 2: Crear Serverless Endpoint

### 2.1 Ir a RunPod Dashboard
- https://www.runpod.io/console/serverless

### 2.2 Crear nuevo endpoint
```
Template: Custom Template
Name: idm-vton-tryon
```

### 2.3 Configurar el container

**Opción A: Usar imagen pre-built (más fácil)**

```
Image: python:3.10-slim
GPU: NVIDIA RTX A5000
```

**Opción B: Build propio (más control)**

```bash
# Build local
docker build -t idm-vton-api -f runpod-dockerfile .

# Login a RunPod
docker login

# Push a RunPod
docker tag idm-vton-api:latest ghcr.io/your-user/idm-vton-api:latest
docker push ghcr.io/your-user/idm-vton-api:latest
```

### 2.4 Environment Variables

```
PYTORCH_CUDA_ALLOC_CONF=max_blocking:32
```

### 2.5 Health Check

```
Endpoint: /health
Timeout: 5s
```

---

## Paso 3: Configurar el Container (cuando hagas deploy)

### Opción A: Docker Compose para local testing

```yaml
# docker-compose.yml para testing local
version: '3.8'
services:
  idm-vton:
    build: .
    ports:
      - "8000:8000"
    environment:
      - CUDA_VISIBLE_DEVICES=0
    volumes:
      - ./model:/app/model
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

### Opción B: RunPod Serverless

```bash
# Después de hacer deploy en RunPod, obtienes:
RUNPOD_API_URL=https://xxxx.runpod.io/v1/tryon
RUNPOD_API_KEY=rp_xxxxx
```

---

## Paso 4: Backend - Agregar Variables

```bash
# .env del backend
RUNPOD_API_KEY=rp_xxxxx
RUNPOD_API_URL=https://xxxx.runpod.io/v1/tryon
RUNPOD_TRYON_ENABLED=false
```

---

## Paso 5: Backend - Crear Endpoint de Testing

```typescript
// backend/src/routes/tryon-test.routes.ts

import { Router } from 'express';
import { getSignedUrl } from '@aws-sdk/client-s3';

const router = Router();

const runpodApiKey = process.env.RUNPOD_API_KEY;
const runpodApiUrl = process.env.RUNPOD_API_URL;

router.post('/webhook/tryon-runpod', async (req, res) => {
  const { brand_id, product_id, selfie_url, product_image_url, prompt } = req.body;
  
  try {
    // 1. Descargar imágenes
    const [selfieRes, garmentRes] = await Promise.all([
      fetch(selfie_url),
      fetch(product_image_url)
    ]);
    
    const [selfieBuffer, garmentBuffer] = await Promise.all([
      selfieRes.arrayBuffer(),
      garmentRes.arrayBuffer()
    ]);
    
    const selfieBase64 = Buffer.from(selfieBuffer).toString('base64');
    const garmentBase64 = Buffer.from(garmentBuffer).toString('base64');
    
    // 2. Llamar a RunPod
    const runpodResponse = await fetch(`${runpodApiUrl}/tryon`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${runpodApiKey}`
      },
      body: JSON.stringify({
        person_image: selfieBase64,
        garment_image: garmentBase64,
        garment_description: prompt || 'clothing item',
        seed: -1
      })
    });
    
    const result = await runpodResponse.json();
    
    // 3. Subir resultado a MinIO
    const outputBuffer = Buffer.from(result.output_image, 'base64');
    const outputUrl = await uploadToMinIO(outputBuffer, `vton-${Date.now()}.jpg`);
    
    // 4. Responder
    res.json({
      success: true,
      imageUrl: outputUrl,
      _meta: {
        model: 'idm-vton-runpod',
        brandId: brand_id,
        productId: product_id
      }
    });
    
  } catch (error) {
    console.error('RunPod tryon error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
```

---

## Paso 6: Importar Workflow a n8n

1. Abrir n8n Dashboard
2. Importar desde archivo: `docs/design/runpod-idm-vton-workflow.json`
3. Configurar credenciales:
   - `Lookitry API Token` (ya existe)
   - Añadir `RUNPOD_API_URL` y `RUNPOD_API_KEY` como variables de entorno
4. Activar workflow
5. Copiar URL del webhook

---

## Paso 7: Testing

### Test con cURL

```bash
curl -X POST https://tu-n8n.com/webhook/tryon-runpod \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "tu-brand-uuid",
    "product_id": "tu-product-uuid",
    "selfie_url": "https://minio.wilkiedevs.com/images/selfie.jpg",
    "product_image_url": "https://minio.wilkiedevs.com/images/vestido.jpg",
    "prompt": "Vestido azul floral"
  }'
```

### Respuesta esperada

```json
{
  "success": true,
  "imageUrl": "https://minio.wilkiedevs.com/images/vton-xxxxx.jpg",
  "_meta": {
    "model": "idm-vton-runpod",
    "brandId": "...",
    "productId": "..."
  }
}
```

---

## Estructura de Archivos

```
lookitry/
├── docs/
│   └── design/
│       ├── RUNPOD_IDM_VTON_WORKFLOW_DESIGN.md  ← Diseño técnico
│       ├── runpod-idm-vton-workflow.json     ← Workflow n8n
│       ├── runpod-dockerfile                  ← Dockerfile
│       ├── runpod-requirements.txt          ← Dependencias
│       ├── runpod-main.py                    ← FastAPI server
│       └── RUNPOD_SETUP.md                   ← Este archivo
├── backend/
│   └── src/
│       └── routes/
│           └── tryon-test.routes.ts          ← Endpoint de testing
└── frontend/
    └── ... (botón de testing opcional)
```

---

## Comandos Rápidos

```bash
# Build Docker local (para testing)
docker build -t idm-vton-test -f docs/design/runpod-dockerfile .

# Run local (necesita GPU)
docker run --gpus all -p 8000:8000 idm-vton-test

# Test local endpoint
curl -X POST http://localhost:8000/tryon \
  -H "Content-Type: application/json" \
  -d '{"person_image":"...","garment_image":"...","garment_description":"test"}'
```

---

## Troubleshooting

### Error: "Model not loading"
- Verificar que el modelo IDM-VTON está en el container
- Logs de RunPod muestran el error exacto

### Error: "CUDA out of memory"
- Reducir batch size
- Usar GPU con más VRAM

### Error: "Connection refused"
- Verificar que el container está corriendo
- Check health endpoint: `GET /health`

---

## Siguiente Paso

Una vez tengas el endpoint de RunPod funcionando:
1. Configurar `RUNPOD_API_URL` y `RUNPOD_API_KEY` en backend
2. Importar workflow JSON a n8n
3. Hacer primeras pruebas
4. Comparar calidad vs Gemini
