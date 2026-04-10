-- Migración: columnas de perfil/contacto en tabla brands
-- Ejecutar en Supabase SQL Editor

ALTER TABLE brands
  ADD COLUMN IF NOT EXISTS phone        TEXT,
  ADD COLUMN IF NOT EXISTS contact_name TEXT,
  ADD COLUMN IF NOT EXISTS address      TEXT,
  ADD COLUMN IF NOT EXISTS city         TEXT,
  ADD COLUMN IF NOT EXISTS country      TEXT,
  ADD COLUMN IF NOT EXISTS nit          TEXT,
  ADD COLUMN IF NOT EXISTS website      TEXT;
