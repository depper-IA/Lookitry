-- Script SQL para crear tabla de administradores
-- Ejecutar en Supabase SQL Editor

-- 1. Crear tabla admins
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Crear indice para email
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- 3. Crear trigger para updated_at
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. NO insertes admins con hashes placeholder.
-- Eso rompe el login y el cambio de contrasena.
--
-- Crea el admin de forma segura con:
--   npx ts-node src/scripts/create-admin.ts
--
-- Variables esperadas:
--   ADMIN_EMAIL=info.samwilkie@gmail.com
--   ADMIN_PASSWORD=tu_password_seguro
--   ADMIN_NAME=WilkieDevs
--   ADMIN_PERMISSIONS=brands,subscriptions,revenue,conversion,health,notifications,settings,admins
