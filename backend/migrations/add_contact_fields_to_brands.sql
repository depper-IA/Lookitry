-- Agregar campos de contacto a la tabla brands
ALTER TABLE brands
ADD COLUMN IF NOT EXISTS contact_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS country TEXT;

-- Comentarios para documentación
COMMENT ON COLUMN brands.contact_name IS 'Nombre de la persona de contacto';
COMMENT ON COLUMN brands.phone IS 'Teléfono de contacto';
COMMENT ON COLUMN brands.address IS 'Dirección física';
COMMENT ON COLUMN brands.city IS 'Ciudad';
COMMENT ON COLUMN brands.country IS 'País';
