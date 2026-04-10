-- Migración: agregar campo permissions a tabla admins
-- Ejecutar en Supabase SQL Editor

-- Agregar columna permissions (array de strings)
ALTER TABLE admins ADD COLUMN IF NOT EXISTS permissions TEXT[] DEFAULT '{}';

-- El admin principal (superadmin) tiene acceso total
-- Los admins secundarios pueden tener permisos limitados:
--   'brands'       → ver y gestionar marcas
--   'subscriptions'→ ver y gestionar suscripciones
--   'revenue'      → ver ingresos y pagos
--   'conversion'   → ver métricas de conversión
--   'health'       → ver estado del sistema
--   'notifications'→ ver notificaciones
--   'settings'     → configurar medios de pago
--   'admins'       → gestionar otros admins (solo superadmin)

-- Actualizar admin existente como superadmin (acceso total)
UPDATE admins SET permissions = ARRAY[
  'brands','subscriptions','revenue','conversion',
  'health','notifications','settings','admins'
] WHERE role = 'admin';
