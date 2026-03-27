# Guía de Integración: n8n ↔ Lookitry Blog

Para completar la automatización, debes modificar tu flujo actual de n8n para que rinda cuentas al nuevo sistema en lugar de WordPress.

## 1. Configuración de Variables (Entorno)

Asegúrate de que el backend de Lookitry tenga definido un secreto para validar las peticiones de n8n.

**Archivo: `backend/.env` (en el VPS)**
```env
# Define el secreto para el blog
BLOG_WEBHOOK_SECRET=Travis2305**_blog_live
```

## 2. Modificación del Nodo en n8n

El archivo `templates-webs/flujo-blog.json` ya ha sido actualizado con los siguientes cambios:

### Nodo: `Publicar en Lookitry` (antes `Publicar en WordPress1`)
- **Method**: `POST`
- **URL**: `https://api.lookitry.com/api/blog/webhook`
- **Headers**:
    - `x-blog-secret`: `Travis2305**_blog_live`
    - `Content-Type`: `application/json`
- **Body**: Enviado como JSON con los campos `title`, `content`, `excerpt`, `featured_image`, etc.

### Nodo: `Uploader`
- **Method**: `POST`
- **URL**: `https://api.lookitry.com/api/blog/upload`
- **Headers**:
    - `x-blog-secret`: `Travis2305**_blog_live`
- **Body**: `multipart/form-data` con el archivo binario.

## 3. Verificación

Una vez realizado el deploy:
1. Importa el nuevo `flujo-blog.json` en n8n.
2. Ejecuta el flujo.
3. Verifica en el **Panel de Administración de Lookitry** (`/admin/blog`) que el artículo aparezca.
4. El artículo será visible inmediatamente en `https://lookitry.com/blog`.

## 4. Notas Técnicas
- El sistema genera el **slug** automáticamente basándose en el título.
- Las imágenes se suben a MinIO y se sirven desde `https://minio.wilkiedevs.com/images/blog/`.
