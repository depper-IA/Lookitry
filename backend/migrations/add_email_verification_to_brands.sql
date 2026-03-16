-- Migración: agregar campos de verificación de email a la tabla brands
-- Ejecutar en Supabase SQL Editor

ALTER TABLE brands
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_verification_token TEXT DEFAULT NULL;

-- Los usuarios existentes se marcan como verificados para no romper accesos actuales
UPDATE brands SET email_verified = true WHERE email_verified = false;

-- Índice para búsqueda rápida por token
CREATE INDEX IF NOT EXISTS idx_brands_email_verification_token
  ON brands (email_verification_token)
  WHERE email_verification_token IS NOT NULL;
