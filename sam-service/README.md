# Sam Service — Lookitry

Microservicio Python que genera máscaras de silueta para el pipeline Try-On.

## Función

Segmenta la selfie del usuario para aislar la figura humana antes de pasarla a Vertex AI.

## Arquitectura

```
Backend (Express)
    └── sam-service (Docker: port 8000)
            └── MobileSAM (modelo: mobile_sam.pt, 39MB)
                    └── genera mask PNG → base64
                            └── Vertex AI → imagen final Try-On
```

## Tech Stack

- **Runtime**: Python 3.10-slim
- **Framework**: FastAPI + uvicorn
- **Modelo**: MobileSAM (`mobile_sam.pt`)
- **Device**: CPU (no GPU requerido)

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/predict` | Recibe imagen base64, devuelve mask PNG base64 |

### Request
```json
{
  "image": "<base64 encoded RGB image>"
}
```

### Response
```json
{
  "predictions": [{
    "maskBase64": "<base64 PNG mask>"
  }]
}
```

## Configuración

```bash
SAM_LOCAL_URL=http://localhost:8000  # en backend/.env
```

## Docker

```bash
# Build
docker build -t sam-service .

# Run
docker run -p 8000:8000 sam-service
```

## VPS

El servicio corre como `lookitry-sam-local` en el VPS via Docker Compose.
Revisar: `docker-compose.backend.yml` o `vps-docker-compose.yml`