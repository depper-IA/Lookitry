-- Agregar campos de contacto a la tabla brands
ALTER TABLE brands 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS country VARCHAR(100),
ADD COLUMN IF NOT EXISTS contact_name VARCHAR(200);

-- Agregar comentarios para documentación
COMMENT ON COLUMN brands.phone IS 'Número de teléfono de contacto';
COMMENT ON COLUMN brands.address IS 'Dirección física de la marca';
COMMENT ON COLUMN brands.city IS 'Ciudad donde opera la marca';
COMMENT ON COLUMN brands.country IS 'País de la marca';
COMMENT ON COLUMN brands.contact_name IS 'Nombre de la persona de contacto';
