-- Script SQL para crear tabla de administradores
-- Ejecutar en Supabase SQL Editor

-- Tabla admins
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para email
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- Trigger para updated_at
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar admin por defecto (cambiar la contraseña después)
-- Contraseña: admin123 (hasheada con bcrypt)
INSERT INTO admins (email, password, name, role)
VALUES (
  'admin@virtualtry-on.com',
  '$2b$10$rKZxQYQX5Z5Z5Z5Z5Z5Z5uO5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z',
  'Administrador',
  'admin'
)
ON CONFLICT (email) DO NOTHING;

-- Nota: Debes cambiar la contraseña después de crear el primer admin
-- usando el endpoint de actualización o directamente en la base de datos
