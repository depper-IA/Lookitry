-- Agregar google_id a la tabla admins
-- Ejecutar en Supabase SQL Editor

ALTER TABLE admins ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'password';
