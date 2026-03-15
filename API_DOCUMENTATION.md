# API Documentation - Virtual Try-On SaaS

Documentación completa de todos los endpoints de la API REST.

**Base URL**: `http://localhost:3001/api` (desarrollo)

**Autenticación**: JWT Bearer Token en header `Authorization: Bearer {token}`

---

## 📑 Tabla de Contenidos

- [Autenticación](#autenticación)
- [Marcas](#marcas)
- [Productos](#productos)
- [Uso](#uso)
- [Analytics](#analytics)
- [Probador Virtual (Público)](#probador-virtual-público)
- [Códigos de Error](#códigos-de-error)

---

## Autenticación

### Registrar Marca

Crea una nueva cuenta de marca en el sistema.

**Endpoint**: `POST /api/auth/register`

**Autenticación**: No requerida

**Request Body**:
```json
{
  "email": "marca@example.com",
  "password": "password123",
  "name": "Mi Marca",
  "slug": "mi-marca"
}
```

**Validaciones**:
- `email`: Debe ser un email válido y único
- `password`: Mínimo 6 caracteres
- `name`: Requerido, nombre de la marca
- `slug`: Requerido, único, formato kebab-case (solo letras minúsculas, números y guiones)

**Response Success (201)**:
```json
{
  "token": "***REMOVED-SECRET***",
  "brand": {
    "id": "92a6ae1b-48e3-4a7d-8639-8215340704c3",
    "email": "marca@example.com",
    "name": "Mi Marca",
    "slug": "mi-marca",
    "plan": "BASIC"
  }
}
```

**Response Error (400)**:
```json
{
  "error": "VALIDATION_ERROR",
  "message": "El email ya está registrado"
}
```

---

### Iniciar Sesión

Autentica una marca y obtiene un token JWT.

**Endpoint**: `POST /api/auth/login`

**Autenticación**: No requerida

**Request Body**:
```json
{
  "email": "marca@example.com",
  "password": "password123"
}
```

**Response Success (200)**:
```json
{
  "token": "***REMOVED-SECRET***",
  "brand": {
    "id": "92a6ae1b-48e3-4a7d-8639-8215340704c3",
    "email": "marca@example.com",
    "name": "Mi Marca",
    "slug": "mi-marca",
    "plan": "BASIC"
  }
}
```

**Response Error (401)**:
```json
{
  "error": "UNAUTHORIZED",
  "message": "Credenciales inválidas"
}
```

---

## Marcas

### Obtener Datos de Marca

Obtiene la información de la marca autenticada.

**Endpoint**: `GET /api/brands/me`

**Autenticación**: Requerida (JWT)

**Headers**:
```
Authorization: Bearer ***REMOVED-SECRET***
```

**Response Success (200)**:
```json
{
  "id": "92a6ae1b-48e3-4a7d-8639-8215340704c3",
  "email": "marca@example.com",
  "name": "Mi Marca",
  "slug": "mi-marca",
  "plan": "BASIC",
  "logo": "https://example.com/logo.png",
  "primary_color": "#FF5733",
  "secondary_color": "#FFFFFF",
  "created_at": "2026-03-01T10:00:00.000Z",
  "updated_at": "2026-03-10T15:30:00.000Z"
}
```

---

### Actualizar Configuración de Marca

Actualiza la configuración visual de la marca (logo, colores).

**Endpoint**: `PATCH /api/brands/me`

**Autenticación**: Requerida (JWT)

**Headers**:
```
Authorization: Bearer ***REMOVED-SECRET***
Content-Type: application/json
```

**Request Body** (todos los campos son opcionales):
```json
{
  "name": "Nuevo Nombre de Marca",
  "logo": "https://example.com/nuevo-logo.png",
  "primary_color": "#3498db",
  "secondary_color": "#ecf0f1"
}
```

**Validaciones**:
- `primary_color` y `secondary_color`: Deben ser colores hexadecimales válidos (ej: #FF5733)

**Response Success (200)**:
```json
{
  "id": "92a6ae1b-48e3-4a7d-8639-8215340704c3",
  "email": "marca@example.com",
  "name": "Nuevo Nombre de Marca",
  "slug": "mi-marca",
  "plan": "BASIC",
  "logo": "https://example.com/nuevo-logo.png",
  "primary_color": "#3498db",
  "secondary_color": "#ecf0f1",
  "created_at": "2026-03-01T10:00:00.000Z",
  "updated_at": "2026-03-12T16:45:00.000Z"
}
```

**Response Error (400)**:
```json
{
  "error": "VALIDATION_ERROR",
  "message": "El color primario debe ser un hexadecimal válido"
}
```

---

## Productos

### Listar Productos

Obtiene todos los productos activos de la marca autenticada.

**Endpoint**: `GET /api/products`

**Autenticación**: Requerida (JWT)

**Headers**:
```
Authorization: Bearer ***REMOVED-SECRET***
```

**Response Success (200)**:
```json
{
  "products": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "brand_id": "92a6ae1b-48e3-4a7d-8639-8215340704c3",
      "name": "Camiseta Logo",
      "description": "Camiseta con logo frontal",
      "image_url": "https://example.com/camiseta.jpg",
      "category": "tshirt",
      "is_active": true,
      "created_at": "2026-03-05T12:00:00.000Z",
      "updated_at": "2026-03-05T12:00:00.000Z"
    },
    {
      "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "brand_id": "92a6ae1b-48e3-4a7d-8639-8215340704c3",
      "name": "Hoodie Premium",
      "description": "Hoodie con capucha",
      "image_url": "https://example.com/hoodie.jpg",
      "category": "hoodie",
      "is_active": true,
      "created_at": "2026-03-06T14:30:00.000Z",
      "updated_at": "2026-03-06T14:30:00.000Z"
    }
  ],
  "count": 2,
  "limit": 5
}
```

---

### Crear Producto

Crea un nuevo producto para la marca autenticada.

**Endpoint**: `POST /api/products`

**Autenticación**: Requerida (JWT)

**Headers**:
```
Authorization: Bearer ***REMOVED-SECRET***
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "Gorra Snapback",
  "description": "Gorra ajustable con logo bordado",
  "image_url": "https://example.com/gorra.jpg",
  "category": "cap"
}
```

**Validaciones**:
- `name`: Requerido
- `image_url`: Requerido, debe ser una URL válida
- `category`: Requerido
- `description`: Opcional
- Límite de productos según plan (5 para BASIC, 15 para PRO)

**Response Success (201)**:
```json
{
  "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "brand_id": "92a6ae1b-48e3-4a7d-8639-8215340704c3",
  "name": "Gorra Snapback",
  "description": "Gorra ajustable con logo bordado",
  "image_url": "https://example.com/gorra.jpg",
  "category": "cap",
  "is_active": true,
  "created_at": "2026-03-12T17:00:00.000Z",
  "updated_at": "2026-03-12T17:00:00.000Z"
}
```

**Response Error (403)**:
```json
{
  "error": "LIMIT_EXCEEDED",
  "message": "Has alcanzado el límite de 5 productos para tu plan",
  "limit": 5,
  "current": 5
}
```

---

### Actualizar Producto

Actualiza un producto existente.

**Endpoint**: `PUT /api/products/:id`

**Autenticación**: Requerida (JWT)

**Headers**:
```
Authorization: Bearer ***REMOVED-SECRET***
Content-Type: application/json
```

**URL Parameters**:
- `id`: UUID del producto

**Request Body** (todos los campos son opcionales):
```json
{
  "name": "Gorra Snapback Edición Limitada",
  "description": "Gorra ajustable con logo bordado - Edición limitada",
  "image_url": "https://example.com/gorra-limited.jpg",
  "category": "cap"
}
```

**Response Success (200)**:
```json
{
  "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "brand_id": "92a6ae1b-48e3-4a7d-8639-8215340704c3",
  "name": "Gorra Snapback Edición Limitada",
  "description": "Gorra ajustable con logo bordado - Edición limitada",
  "image_url": "https://example.com/gorra-limited.jpg",
  "category": "cap",
  "is_active": true,
  "created_at": "2026-03-12T17:00:00.000Z",
  "updated_at": "2026-03-12T17:30:00.000Z"
}
```

**Response Error (404)**:
```json
{
  "error": "NOT_FOUND",
  "message": "Producto no encontrado"
}
```

---

### Eliminar Producto

Elimina un producto (soft delete - mantiene generaciones históricas).

**Endpoint**: `DELETE /api/products/:id`

**Autenticación**: Requerida (JWT)

**Headers**:
```
Authorization: Bearer ***REMOVED-SECRET***
```

**URL Parameters**:
- `id`: UUID del producto

**Response Success (200)**:
```json
{
  "message": "Producto eliminado exitosamente"
}
```

**Response Error (404)**:
```json
{
  "error": "NOT_FOUND",
  "message": "Producto no encontrado"
}
```

---

## Uso

### Obtener Estadísticas de Uso

Obtiene las estadísticas de uso de la marca autenticada (generaciones y productos).

**Endpoint**: `GET /api/usage/stats`

**Autenticación**: Requerida (JWT)

**Headers**:
```
Authorization: Bearer ***REMOVED-SECRET***
```

**Response Success (200)**:
```json
{
  "currentMonth": {
    "generationsUsed": 45,
    "generationsLimit": 400,
    "productsCount": 3,
    "productsLimit": 5
  },
  "percentageUsed": 11.25,
  "resetDate": "2026-04-01T00:00:00.000Z"
}
```

**Descripción de campos**:
- `generationsUsed`: Generaciones exitosas en el mes actual
- `generationsLimit`: Límite mensual según plan
- `productsCount`: Productos activos actuales
- `productsLimit`: Límite de productos según plan
- `percentageUsed`: Porcentaje de generaciones usadas
- `resetDate`: Fecha de reset del contador mensual

---

## Analytics

### Obtener Analytics Completos

Obtiene analytics completos de la marca: generaciones, productos más usados y tendencias mensuales.

**Endpoint**: `GET /api/analytics/overview`

**Autenticación**: Requerida (JWT)

**Headers**:
```
Authorization: Bearer ***REMOVED-SECRET***
```

**Response Success (200)**:
```json
{
  "totalGenerations": 127,
  "successfulGenerations": 115,
  "failedGenerations": 12,
  "successRate": 90.55,
  "mostUsedProducts": [
    {
      "productId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "productName": "Camiseta Logo",
      "productImageUrl": "https://example.com/camiseta.jpg",
      "category": "tshirt",
      "totalGenerations": 67,
      "successfulGenerations": 62,
      "lastUsed": "2026-03-12T16:30:00.000Z"
    },
    {
      "productId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "productName": "Hoodie Premium",
      "productImageUrl": "https://example.com/hoodie.jpg",
      "category": "hoodie",
      "totalGenerations": 48,
      "successfulGenerations": 43,
      "lastUsed": "2026-03-12T15:45:00.000Z"
    }
  ],
  "generationsByMonth": [
    {
      "month": "2025-10",
      "count": 0
    },
    {
      "month": "2025-11",
      "count": 12
    },
    {
      "month": "2025-12",
      "count": 28
    },
    {
      "month": "2026-01",
      "count": 35
    },
    {
      "month": "2026-02",
      "count": 42
    },
    {
      "month": "2026-03",
      "count": 10
    }
  ]
}
```

---

### Obtener Estadísticas de Generaciones

Obtiene solo las estadísticas de generaciones de la marca.

**Endpoint**: `GET /api/analytics/generations`

**Autenticación**: Requerida (JWT)

**Headers**:
```
Authorization: Bearer ***REMOVED-SECRET***
```

**Response Success (200)**:
```json
{
  "brandId": "92a6ae1b-48e3-4a7d-8639-8215340704c3",
  "brandName": "Mi Marca",
  "totalGenerations": 127,
  "successfulGenerations": 115,
  "failedGenerations": 12,
  "successRate": 90.55
}
```

---

### Obtener Productos Más Usados

Obtiene los productos más usados ordenados por número de generaciones.

**Endpoint**: `GET /api/analytics/products/most-used`

**Autenticación**: Requerida (JWT)

**Headers**:
```
Authorization: Bearer ***REMOVED-SECRET***
```

**Query Parameters**:
- `limit` (opcional): Número máximo de productos a retornar (default: 10)

**Ejemplo**: `GET /api/analytics/products/most-used?limit=5`

**Response Success (200)**:
```json
{
  "products": [
    {
      "productId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "productName": "Camiseta Logo",
      "productImageUrl": "https://example.com/camiseta.jpg",
      "category": "tshirt",
      "totalGenerations": 67,
      "successfulGenerations": 62,
      "lastUsed": "2026-03-12T16:30:00.000Z"
    },
    {
      "productId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "productName": "Hoodie Premium",
      "productImageUrl": "https://example.com/hoodie.jpg",
      "category": "hoodie",
      "totalGenerations": 48,
      "successfulGenerations": 43,
      "lastUsed": "2026-03-12T15:45:00.000Z"
    }
  ],
  "count": 2
}
```

---

## Probador Virtual (Público)

### Obtener Configuración de Marca

Obtiene la configuración visual y productos de una marca para el probador público.

**Endpoint**: `GET /api/pruebalo/:brandSlug`

**Autenticación**: No requerida (público)

**URL Parameters**:
- `brandSlug`: Slug único de la marca (ej: "mi-marca")

**Ejemplo**: `GET /api/pruebalo/mi-marca`

**Response Success (200)**:
```json
{
  "brand": {
    "name": "Mi Marca",
    "logo": "https://example.com/logo.png",
    "primaryColor": "#FF5733",
    "secondaryColor": "#FFFFFF"
  },
  "products": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "Camiseta Logo",
      "imageUrl": "https://example.com/camiseta.jpg",
      "category": "tshirt"
    },
    {
      "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "name": "Hoodie Premium",
      "imageUrl": "https://example.com/hoodie.jpg",
      "category": "hoodie"
    }
  ]
}
```

**Response Error (404)**:
```json
{
  "error": "BRAND_NOT_FOUND",
  "message": "Marca no encontrada"
}
```

---

### Generar Try-On

Genera una imagen de try-on virtual usando IA.

**Endpoint**: `POST /api/pruebalo/:brandSlug/generate`

**Autenticación**: No requerida (público)

**Content-Type**: `multipart/form-data`

**URL Parameters**:
- `brandSlug`: Slug único de la marca

**Form Data**:
- `productId`: UUID del producto (string)
- `selfie`: Archivo de imagen (File)

**Validaciones**:
- Archivo: JPG, PNG o WEBP
- Tamaño máximo: 5MB
- Marca debe existir
- Producto debe existir y pertenecer a la marca
- No debe exceder límite mensual de generaciones

**Ejemplo con cURL**:
```bash
curl -X POST \
  http://localhost:3001/api/pruebalo/mi-marca/generate \
  -F "productId=a1b2c3d4-e5f6-7890-abcd-ef1234567890" \
  -F "selfie=@/path/to/selfie.jpg"
```

**Response Success (200)**:
```json
{
  "success": true,
  "generationId": "d4e5f6a7-b8c9-0123-def1-234567890123",
  "imageUrl": "https://example.com/results/generated-image.jpg",
  "processingTime": 8500
}
```

**Response Error (400) - Archivo Inválido**:
```json
{
  "error": "INVALID_FILE_TYPE",
  "message": "Solo se permiten archivos JPG, PNG o WEBP"
}
```

**Response Error (400) - Archivo Muy Grande**:
```json
{
  "error": "FILE_TOO_LARGE",
  "message": "El archivo no debe superar 5MB"
}
```

**Response Error (404) - Producto No Encontrado**:
```json
{
  "error": "PRODUCT_NOT_FOUND",
  "message": "Producto no encontrado"
}
```

**Response Error (429) - Límite Excedido**:
```json
{
  "error": "LIMIT_EXCEEDED",
  "message": "Has excedido el límite de 400 generaciones mensuales",
  "usage": {
    "used": 400,
    "limit": 400
  }
}
```

**Response Error (502) - Error de Generación**:
```json
{
  "error": "GENERATION_FAILED",
  "message": "Error al generar la imagen. Por favor intenta de nuevo."
}
```

---

## Códigos de Error

### Códigos HTTP

| Código | Descripción |
|--------|-------------|
| 200 | OK - Solicitud exitosa |
| 201 | Created - Recurso creado exitosamente |
| 400 | Bad Request - Error de validación |
| 401 | Unauthorized - No autenticado o token inválido |
| 403 | Forbidden - No autorizado o límite excedido |
| 404 | Not Found - Recurso no encontrado |
| 429 | Too Many Requests - Rate limit excedido |
| 500 | Internal Server Error - Error del servidor |
| 502 | Bad Gateway - Error en servicio externo (n8n) |

### Códigos de Error Personalizados

| Código | Descripción |
|--------|-------------|
| `VALIDATION_ERROR` | Error de validación de datos |
| `UNAUTHORIZED` | No autenticado o credenciales inválidas |
| `FORBIDDEN` | Operación no permitida |
| `NOT_FOUND` | Recurso no encontrado |
| `BRAND_NOT_FOUND` | Marca no encontrada |
| `PRODUCT_NOT_FOUND` | Producto no encontrado |
| `LIMIT_EXCEEDED` | Límite de plan excedido |
| `INVALID_FILE_TYPE` | Tipo de archivo no permitido |
| `FILE_TOO_LARGE` | Archivo excede tamaño máximo |
| `MISSING_FILE` | Archivo requerido no proporcionado |
| `GENERATION_FAILED` | Error al generar imagen con IA |
| `INTERNAL_ERROR` | Error interno del servidor |

---

## Rate Limiting

La API implementa rate limiting para proteger contra abuso:

- **Endpoints públicos**: 100 requests por 15 minutos por IP
- **Endpoints protegidos**: Sin límite (protegidos por autenticación)

**Response cuando se excede el límite (429)**:
```json
{
  "error": "TOO_MANY_REQUESTS",
  "message": "Demasiadas solicitudes. Por favor intenta de nuevo más tarde.",
  "retryAfter": 900
}
```

---

## Ejemplos de Uso

### Flujo Completo: Registro → Crear Producto → Generar Try-On

#### 1. Registrar Marca

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "marca@example.com",
    "password": "password123",
    "name": "Mi Marca",
    "slug": "mi-marca"
  }'
```

Guardar el `token` de la respuesta.

#### 2. Crear Producto

```bash
curl -X POST http://localhost:3001/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "name": "Camiseta Logo",
    "description": "Camiseta con logo frontal",
    "image_url": "https://example.com/camiseta.jpg",
    "category": "tshirt"
  }'
```

Guardar el `id` del producto.

#### 3. Generar Try-On (como cliente final)

```bash
curl -X POST http://localhost:3001/api/pruebalo/mi-marca/generate \
  -F "productId={PRODUCT_ID}" \
  -F "selfie=@/path/to/selfie.jpg"
```

---

## Notas Adicionales

- Todos los timestamps están en formato ISO 8601 (UTC)
- Los UUIDs son v4
- Las URLs de imágenes deben ser accesibles públicamente
- El token JWT expira en 7 días
- Los contadores de generaciones se resetean el día 1 de cada mes a las 00:00 UTC
