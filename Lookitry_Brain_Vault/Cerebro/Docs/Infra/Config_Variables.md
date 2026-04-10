# ⚙️ Infra: Variables y Servicios

Este documento mapea qué servicios externos utiliza Lookitry y qué variables de entorno (`.env`) controlan cada uno.

## 1. Motores de IA (OpenRouter / n8n)
| Variable | Propósito |
|----------|-----------|
| `N8N_WEBHOOK_URL` | URL donde el backend envía las peticiones de imagen. |
| `N8N_BEARER_TOKEN` | Token de seguridad para hablar con n8n. |

## 2. Pasarela de Pagos (Wompi)
| Variable | Propósito |
|----------|-----------|
| `WOMPI_PUBLIC_KEY` | Para inicializar el widget de pago en el frontend. |
| `WOMPI_EVENTS_SECRET` | Para validar la autenticidad de los Webhooks. |
| `WOMPI_INTEGRITY_SECRET` | Para firmar las peticiones de pago y evitar fraude. |

## 3. Almacenamiento (MinIO / S3)
| Variable | Propósito |
|----------|-----------|
| `MINIO_ENDPOINT` | URL del servidor de archivos (`minio.wilkiedevs.com`). |
| `MINIO_BUCKET` | Nombre del contenedor (usualmente `images`). |

## 4. Base de Datos (Supabase / Postgres)
| Variable | Propósito |
|----------|-----------|
| `SUPABASE_URL` | Punto de conexión a la base de datos. |
| `SUPABASE_SERVICE_KEY` | **Clave Maestra**: Se usa en el backend para saltarse las reglas RLS. |

## 5. Correo (SMTP / Hostinger)
| Variable | Propósito |
|----------|-----------|
| `SMTP_HOST` | Servidor de salida (`smtp.hostinger.com`). |
| `SMTP_USER` | Email remitente (`info@lookitry.com`). |

> [!WARNING]
> **Seguridad**: Las claves `SECRET` nunca deben exponerse en el Frontend. El archivo `.env` del Frontend solo debe contener variables que empiecen por `NEXT_PUBLIC_`.
