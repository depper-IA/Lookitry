-- Script SQL para crear tabla de administradores
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Importante:
-- No insertes admins con hashes bcrypt inventados o placeholders.
-- Para crear el primer admin de forma segura usa:
--   npx ts-node src/scripts/create-admin.ts
--
-- Variables esperadas:
--   ADMIN_EMAIL=admin@virtualtry-on.com
--   ADMIN_PASSWORD=tu_password_seguro
--   ADMIN_NAME=Administrador
--   ADMIN_PERMISSIONS=brands,subscriptions,revenue,conversion,health,notifications,settings,admins
