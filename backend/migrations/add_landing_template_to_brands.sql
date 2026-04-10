-- Agregar columna landing_template a la tabla brands
-- Esta columna almacena el template seleccionado para la mini-landing

ALTER TABLE brands
ADD COLUMN IF NOT EXISTS landing_template VARCHAR(20) DEFAULT 'classic';

-- Actualizar marcas existentes que tenían 'probador' al nuevo nombre 'moderno'
UPDATE brands
SET landing_template = 'moderno'
WHERE landing_template = 'probador';

-- Comentario de la columna
COMMENT ON COLUMN brands.landing_template IS 'Template de la mini-landing: classic, editorial, moderno';
