# Migración: Agregar columna landing_template

## Problema identificado

La columna `landing_template` NO existe en la tabla `brands` de la base de datos. Por eso, aunque el frontend envía el valor correctamente y el backend lo recibe, no se está guardando.

## Solución

Ejecutar el siguiente SQL en el dashboard de Supabase:

### Opción 1: Dashboard de Supabase (RECOMENDADO)

1. Ir a https://supabase.com/dashboard/project/vkdooutklowctuudjnkl/editor
2. Abrir el SQL Editor
3. Ejecutar el siguiente SQL:

```sql
-- Agregar columna landing_template a la tabla brands
ALTER TABLE brands
ADD COLUMN IF NOT EXISTS landing_template VARCHAR(20) DEFAULT 'classic';

-- Actualizar marcas existentes que tenían 'probador' al nuevo nombre 'moderno'
UPDATE brands
SET landing_template = 'moderno'
WHERE landing_template = 'probador';

-- Comentario de la columna
COMMENT ON COLUMN brands.landing_template IS 'Template de la mini-landing: classic, editorial, moderno';
```

4. Verificar que la columna se creó correctamente:

```sql
SELECT id, name, landing_template
FROM brands
LIMIT 5;
```

### Opción 2: Desde el backend (si tienes acceso SSH al VPS)

```bash
cd /root/virtual-tryon/backend
npm run migrate:add-landing-template
```

## Verificación

Después de ejecutar la migración:

1. Ir a `/dashboard/mi-pagina` en el frontend
2. Seleccionar un template diferente (ej. Editorial)
3. Hacer click en "Guardar"
4. Abrir la consola del navegador y verificar que se envía: `📤 Guardando landing_template: editorial`
5. Ir a la página pública: `https://pruebalo.wilkiedevs.com/sitio/wilkie-devs`
6. Verificar que el template cambió correctamente

## Archivos relacionados

- Migración SQL: `backend/migrations/add_landing_template_to_brands.sql`
- Script de migración: `backend/src/scripts/add-landing-template-column.ts`
- Frontend (editor): `frontend/src/app/dashboard/mi-pagina/page.tsx`
- Frontend (página pública): `frontend/src/app/sitio/[brandSlug]/page.tsx`
- Componente MiniLanding: `frontend/src/components/mini-landing/MiniLanding.tsx`
