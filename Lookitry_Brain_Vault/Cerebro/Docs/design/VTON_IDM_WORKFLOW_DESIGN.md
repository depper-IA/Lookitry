# Diseño Técnico: Workflow n8n para IDM-VTON

**Fecha:** 10 Abril 2026  
**Tipo:** Workflow paralelo de testing (NO afecta flujo actual)  
**Estado:** Diseño - Sin implementación

---

## 1. Resumen Ejecutivo

Se propone crear un **workflow n8n independiente** que utilice **IDM-VTON** (modelo VTON de Intel publicado en Hugging Face) como alternativa al flujo actual de Gemini. Este workflow es **completamente paralelo** al flujo existente y no lo modifica.

### Objetivos
- Testing de calidad de imagen sin afectar producción
- Comparación A/B si se desea
- Costo mínimo (gratuito via Hugging Face Space)

### Restricciones
- NO modificar flujo actual de Try-On
- NO afectar生成的 actuales de usuarios
- El espacio de HF puede tener rate limits

---

## 2. Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO EXISTENTE (NO TOCAR)                  │
│                                                                 │
│  Frontend → Backend → /webhook/tryon → n8n (Gemini) → MinIO     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    NUEVO FLUJO IDM-VTON (Testing)               │
│                                                                 │
│  Frontend → Backend → /webhook/tryon-idm → n8n (IDM-VTON) → MinIO │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Especificación Técnica de IDM-VTON

### 3.1 Modelo
- **Nombre:** IDM-VTON (Intel)
- **Ubicación:** `huggingface.co/spaces/yisol/IDM-VTON`
- **License:** Research only (verificar antes de uso comercial)
- **Paper:** https://arxiv.org/abs/2312.01725

### 3.2 Inputs de la API
```python
start_tryon(
    dict={                    # ImageEditor structure
        "background": PIL.Image,  # Human photo
        "layers": [PIL.Image],    # Manual mask layers (optional)
        "composite": PIL.Image     # Composite output
    },
    garm_img=PIL.Image,      # Garment/clothing image
    garment_des=str,          # "Short Sleeve Round Neck T-shirts"
    is_checked=bool,          # Use auto-mask (default: True)
    is_checked_crop=bool,     # Auto crop/resize (default: False)
    denoise_steps=int,         # 20-40 (default: 30)
    seed=int                   # -1 to 2147483647 (default: 42)
)
```

### 3.3 Outputs
```python
# Tuple de 2 imágenes
(
    output_image: PIL.Image,   # Resultado final del try-on
    masked_img: PIL.Image      # Imagen con máscara aplicada
)
```

### 3.4 Limitaciones Conocidas
- **License:** CC BY-NC-SA 4.0 - NO comercial
- **Rate limit:** Hugging Face Spacesgratuitos tienen límites
- **GPU:** Requiere GPU (el Space usa `@spaces.GPU`)
- **Auto-mask:** Toma ~5 segundos extra

---

## 4. Diseño del Workflow n8n

### 4.1 Estructura General

```
Webhook (/webhook/tryon-idm)
    │
    ├── 1. Validar Input
    │       ├── brand_id, product_id, selfie_url, product_image_url
    │       └── prompt (para descripción de garment)
    │
    ├── 2. Descargar Imágenes
    │       ├── selfie (human) → binary
    │       └── product (garment) → binary
    │
    ├── 3. Preparar Payload para IDM-VTON
    │       ├── Construir dict con estructura Gradio ImageEditor
    │       ├── Convertir imágenes a base64
    │       └── Configurar parámetros
    │
    ├── 4. Llamar a Hugging Face Space API
    │       └── POST a https://yisol-idm-vton.hf.space/api/v0/tryon
    │
    ├── 5. Procesar Respuesta
    │       ├── Extraer imagen base64 del output
    │       └── Convertir a binary
    │
    ├── 6. Upload a MinIO
    │       └── Guardar resultado en bucket images/
    │
    ├── 7. Cleanup
    │       └── Eliminar imágenes temporales descargadas
    │
    └── 8. Responder
            └── { success, imageUrl, _meta }
```

### 4.2 Nodos del Workflow

| Nodo | Tipo | Función |
|------|------|---------|
| `Webhook` | n8n-nodes-base.webhook | Recibe requests de testing |
| `Validar Input` | n8n-nodes-base.code | Validar campos requeridos |
| `Descargar Selfie` | HTTP Request | GET selfie_url → binary |
| `Descargar Producto` | HTTP Request | GET product_image_url → binary |
| `Preparar Dict Gradio` | n8n-nodes-base.code | Construir estructura ImageEditor |
| `Llamar IDM-VTON API` | HTTP Request | POST al Space API |
| `Extraer Imagen` | n8n-nodes-base.code | Parsear base64 del output |
| `Convertir a File` | convertToFile | Binary → JPEG |
| `Subir a MinIO` | HTTP Request | POST /api/upload/selfie |
| `Limpiar Temp` | HTTP Request | DELETE /api/upload/cleanup-temp |
| `Responder` | respondToWebhook | JSON response |

### 4.3 Payload para IDM-VTON

```json
{
  "data": [
    {
      "background": {
        "data": "base64...",
        "is_file": false,
        "name": "selfie.jpg",
        "type": "file"
      },
      "layers": [null],
      "composite": null
    },
    {
      "data": "base64...",
      "is_file": false,
      "name": "garment.jpg",
      "type": "file"
    },
    "Short Sleeve Round Neck T-shirts",  // garment description
    true,   // is_checked (auto-mask)
    false,  // is_checked_crop
    30,     // denoise_steps
    -1      // seed (-1 = random)
  ]
}
```

---

## 5. Endpoints del Backend Asociados

### 5.1 Nuevo Webhook
- **Path:** `/webhook/tryon-idm`
- **Método:** POST
- **Body:**
```json
{
  "brand_id": "uuid",
  "product_id": "uuid",
  "selfie_url": "https://minio.wilkiedevs.com/...",
  "product_image_url": "https://minio.wilkiedevs.com/...",
  "prompt": "Descripción del producto para IDM-VTON"
}
```

### 5.2 Respuesta
```json
{
  "success": true,
  "imageUrl": "https://minio.wilkiedevs.com/images/...",
  "_meta": {
    "model": "idm-vton",
    "executionId": "n8n-execution-id",
    "generatedAt": "2026-04-10T..."
  }
}
```

---

## 6. Variables de Entorno Requeridas

```bash
# Backend (nuevas)
IDM_VTON_WEBHOOK_URL=https://api.lookitry.com/webhook/tryon-idm
IDM_VTON_ENABLED=false  # Flag para activar testing

# n8n Workflow
HF_SPACE_URL=https://yisol-idm-vton.hf.space/api/v0/tryon
HF_SPACE_API_KEY=  # Opcional si el Space lo requiere
```

---

## 7. Comparativa con Flujo Actual

| Aspecto | Flujo Actual (Gemini) | Flujo IDM-VTON (Testing) |
|---------|---------------------|-------------------------|
| **Modelo** | Gemini 2.5 Flash | IDM-VTON (SDXL-based) |
| **Costo** | ~$0.05-0.09/imagen | Gratis (HF Space) |
| **Prompt-based** | Sí | Sí + Image-based |
| **Auto-mask** | No | Sí (5s extra) |
| **Residuos de ropa** | Problema reportado | Debería resolver mejor |
| **Tallas/Obesidad** | Problema reportado | Mejor preservación |
| **Texturas/Marcas** | Variable | IP-Adapter ayuda |
| **License** | Comercial | CC BY-NC-SA 4.0 (NO comercial) |
| **Integración** | Actual | Paralela/Testing |

---

## 8. Diagrama de Flujo n8n

```
┌──────────────┐
│   Webhook   │  /webhook/tryon-idm
└──────┬───────┘
       │
┌──────▼───────┐
│ Validar Input │  Code Node
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
              ┌───────▼────────┐
              │ Preparar Dict   │  Construir payload
              │ Gradio         │  ImageEditor format
              └───────┬────────┘
                      │
              ┌───────▼────────┐
              │ Llamar HF      │  HTTP POST
              │ Space API      │  IDM-VTON
              └───────┬────────┘
                      │
              ┌───────▼────────┐
              │ Extraer        │  Parse base64
              │ Imagen         │
              └───────┬────────┘
                      │
              ┌───────▼────────┐
              │ Convert to     │  Binary → JPEG
              │ File           │
              └───────┬────────┘
                      │
              ┌───────▼────────┐
              │ Upload MinIO   │  POST /api/upload/selfie
              └───────┬────────┘
                      │
              ┌───────▼────────┐
              │ Cleanup Temp   │  DELETE /api/upload/cleanup
              └───────┬────────┘
                      │
              ┌───────▼────────┐
              │ Responder      │  JSON response
              │ Éxito         │
              └───────────────┘
```

---

## 9. Consideraciones de Rate Limiting

### Hugging Face Spaces Gratuitos
- **Límite:** ~100 requests/minuto (varía por tráfico)
- **GPU:** Puede haber cola de espera
- **Recomendación:** No usar para producción, solo testing

### Estrategias de Mitigación
1. **Queue:** Si el Space está ocupado, esperar y reintentar
2. **Fallback:** Si falla completamente, retornar error (no usar Gemini como backup automático)
3. **Batching:** No procesar múltiples requests simultáneamente

---

## 10. Workflow n8n JSON

El workflow JSON está guardado en: `docs/design/vton-idm-workflow.json`

### 10.1 Importar a n8n
1. Ir a n8n Dashboard
2. Importar desde archivo JSON
3. Configurar credenciales:
   - `Lookitry API Token` (ya existente, ID: `63r9snmc2rxxlWAn`)
4. Activar workflow
5. Obtener URL del webhook

### 10.2 Cambios Requeridos en Backend
Crear endpoint en `backend/src/routes/`:
```typescript
// routes/tryon-idm.routes.ts
router.post('/webhook/tryon-idm', (req, res) => {
  // Forward al webhook de n8n
  const n8nWebhookUrl = process.env.N8N_IDM_WEBHOOK_URL;
  // ...proxy logic
});
```

---

## 11. Siguientes Pasos (Sin Implementación Aún)

1. [ ] Crear webhook endpoint `/webhook/tryon-idm` en backend
2. [ ] Importar workflow JSON a n8n
3. [ ] Configurar N8N_IDM_WEBHOOK_URL en backend
4. [ ] Testear conexión con HF Space API
5. [ ] Validar formato de payload correcto
6. [ ] Probar con casos de prueba (vestidos, tallas grandes)
7. [ ] Comparar calidad vs Gemini (sin modificar flujo actual)
8. [ ] Evaluar license para uso comercial futuro
9. [ ] Si IDM-VTON funciona, evaluar FLUX Fill para versión comercial

---

## 12. Notas Importantes

### 12.1 License de IDM-VTON
**CRÍTICO:** IDM-VTON usa CC BY-NC-SA 4.0
- ✅ Gratis para investigación
- ✅ Gratis para testing
- ❌ NO comercial - NO usar en producción sin licensing

### 12.2 Rate Limiting de HF Spaces
Los Spaces gratuitos tienen límites variables. Si el try-on falla por rate limit:
- El workflow retorna error (no fallback automático)
- En producción, considerar HF Inference Endpoints (de pago)

### 12.3 Credenciales n8n
El workflow usa credenciales existentes:
- `Lookitry API Token` (ID: `63r9snmc2rxxlWAn`)
- No necesita nuevas credenciales

### 12.4 Timeout
- HF Space puede tardar 30-60 segundos
- HTTP Request tiene timeout de 180s (3 min)

---

## 11. Alternativas si IDM-VTON no funciona

| Alternativa | Costo | License | Notas |
|-------------|-------|---------|-------|
| **FLUX Fill** | ~$0.04-0.08/img | Comercial | Requiere pipeline custom |
| **OOTDiffusion** | Gratis | CC BY-NC-SA | +100 HF Spaces |
| **CatVTON variants** | Gratis | Varía | Muchos forks disponibles |
| **Self-hosted IDM-VTON** | GPU propia | Research | Elimina rate limits |

---

**Documento de diseño - NO implementar hasta autorización del usuario**
