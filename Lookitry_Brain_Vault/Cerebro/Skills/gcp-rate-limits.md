# Rate Limits - GCP Vertex AI Imagen

## Overview

Rebecca usa GCP Vertex AI (imagen-3.0-generate-001) con el billing de $5 de Sam.

## Billing

| Recurso | Valor |
|---------|-------|
| Billing Account | R5YFTJBL6DY2YVMU |
| Crédito total | $5.00 USD |
| Tipo | Instrumentless credit (un solo uso) |
| Válido hasta | 2026-10-15 |

## Modelos Utilizados

### Generación de Imágenes (Principal)

| Modelo | Endpoint | Costo aproximadogcp |
|--------|----------|-------------------|
| `imagen-3.0-generate-001` | aiplatform.googleapis.com | ~$0.015-0.05 por imagen (según tamaño) |

### Modelos de Texto (Backup)

| Modelo | Endpoint | Quota gratis |
|--------|----------|--------------|
| `gemini-2.0-flash` | generativelanguage.googleapis.com | 20 requests/día |

## Rate Limits a Respetar

### Imagen 3.0 (Vertex AI)

- **Budget**: $5 total = aproximadamente 100-300 imágenes depende del tamaño
- **Recomendación**: Máximo 10-15 imágenes por día
- **Alertar** cuando se llegue a $3.00 gastados

### Gemini texto (free tier)

- **Límite**: 20 requests/día (gemini-2.0-flash)
- **Restart**: Se resetea cada 24 horas
- **No usado** para imágenes (solo para contenido de texto)

## Protocolo de Monitoreo

### Antes de generar imágenes

```
1. Verificar crédito disponible (revisar logs)
2. Estimar costo según tipo de imagen:
   - 512x512: ~$0.015
   - 1024x1024: ~$0.035
   - 4K: ~$0.05
3. Si presupuesto < $1.00, alertar a Sam antes de proceder
```

### Después de generar

```
1. Loggar en memory/rebecca:
   - Timestamp
   - Modelo usado
   - Costo estimado
   - Crédito remaining
2. Si costo > $3.00, notificar a Sam
```

## Alertas

| Situación | Acción |
|-----------|--------|
| Crédito < $2.00 | Notificar a Sam antes de continuar |
| Crédito < $0.50 | Solo generar si es urgente (approval requerido) |
| Crédito agotado | NO generar más, informar a Sam inmediatamente |

## Logs

Ubicación: `Lookitry_Brain_Vault/Cerebro/Logs/gcp_usage_log.md`

Formato:
```
## [YYYY-MM-DD HH:MM]
- Imagen generada: [descripción]
- Modelo: imagen-3.0-generate-001
- Costo estimado: $X.XX
- Crédito remaining: $X.XX
```

## Costos Estimados por Tipo de Imagen

| Tamaño | Costo aprox. | Imágenes con $5 |
|--------|-------------|-----------------|
| 512x512 | $0.015 | ~333 |
| 768x768 | $0.025 | ~200 |
| 1024x1024 | $0.035 | ~142 |
| 2048x2048 | $0.065 | ~76 |
| 4K (3840x2160) | $0.10 | ~50 |

**Recomendación**: Usar 1024x1024 para posts de Instagram (buena calidad + precio razonable)

---

**Creado**: 2026-04-18
**Actualizado**: 2026-04-18
**Agente**: Rebecca
**Billing**: Sam Wilkie (R5YFTJBL6DY2YVMU)