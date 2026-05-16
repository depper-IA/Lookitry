# Esquema de Base de Datos - Lookitry

**Motor:** PostgreSQL (Supabase) + pgvector

---

## Tablas Principales

### 1. `brands` (Marcas / Clientes SaaS)
Almacena la configuración, branding y estado de suscripción de cada tienda.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid | PK, Identificador único |
| `name` | text | Nombre comercial de la marca |
| `slug` | text | Unique, usado en URLs públicas (`/marca/slug`) |
| `email` | text | Email de login |
| `plan` | enum | `BASIC`, `PRO`, `ENTERPRISE`, `TRIAL` |
| `subscription_status` | enum | `active`, `expiring_soon`, `expired`, `suspended` |
| `primary_color` | text | Color principal para el widget (Hex) |
| `logo` | text | URL del logo en MinIO |
| `api_key` | text | Token para integraciones externas |
| `trial_end_date` | timestamp | Fecha fin del periodo de prueba |
| `extra_credits_balance` | int | Saldo de créditos adicionales comprados |
| `created_at` | timestamp | Fecha de registro |

### 2. `generations` (Historial de Try-On)
Registro de cada imagen generada por IA.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid | PK |
| `brand_id` | uuid | FK -> `brands.id` |
| `product_id` | uuid | FK -> `products.id` |
| `status` | text | `PENDING`, `SUCCESS`, `FAILED` |
| `result_image_url` | text | URL del resultado final en MinIO |
| `processing_time` | int | Tiempo en ms |
| `fingerprint` | text | Hash para evitar duplicados sin costo |

### 3. `products` (Catálogo)
Productos sincronizados o creados manualmente.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid | PK |
| `brand_id` | uuid | FK -> `brands.id` |
| `name` | text | Nombre del producto |
| `category` | text | Categoría para reglas de IA (`camisa`, `vestido`, etc.) |
| `image_url` | text | Imagen original del producto |

### 4. `subscription_payments` (Pagos)
Tracking de transacciones vía Wompi/PayPal.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid | PK |
| `brand_id` | uuid | FK -> `brands.id` |
| `amount` | numeric | Monto pagado |
| `plan_type` | text | `trial`, `monthly`, `annual` |
| `status` | text | `completed`, `pending`, `failed` |

---

## Inteligencia de Datos

### RAG & Vectores
- **Tabla:** `lookitry_knowledge`
- **Columna:** `vector` (pgvector 768-dim)
- **Uso:** Almacena el conocimiento de la plataforma para el agente Rebecca.

### Vistas de Monitoreo
- `brand_usage_stats`: Agregado de consumo por marca.
- `subscription_monitoring`: Alertas de vencimiento.