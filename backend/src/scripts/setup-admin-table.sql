-- Script SQL para crear tabla de administradores y el admin WilkieDevs
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

-- 2. Crear índice para email
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- 3. Crear trigger para updated_at
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Insertar admin WilkieDevs
-- Email: info.samwilkie@gmail.com
-- Nombre: WilkieDevs
-- Contraseña: Travis2305* (hasheada con bcrypt)
INSERT INTO admins (email, password, name, role)
VALUES (
  'info.samwilkie@gmail.com',
  '$2b$10$YourHashedPasswordHere',  -- Reemplazar con el hash real
  'WilkieDevs',
  'admin'
)
ON CONFLICT (email) DO NOTHING;

-- Nota: Ejecuta primero este script en Supabase, luego ejecuta:
-- npx ts-node src/scripts/create-wilkiedevs-admin.ts
-- para insertar el admin con la contraseña correctamente hasheada
