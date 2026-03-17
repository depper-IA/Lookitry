-- Migración: agregar campo cover_bg_color a tabla brands
-- Task 47.4 — Color de fondo sólido como alternativa a imagen de portada
-- Se usa en todos los templates cuando no hay cover_image_url

ALTER TABLE brands
  ADD COLUMN IF NOT EXISTS cover_bg_color TEXT DEFAULT NULL;

COMMENT ON COLUMN brands.cover_bg_color IS
  'Color de fondo sólido del hero (formato hex #RRGGBB). Se aplica cuando no hay cover_image_url. Si es NULL, se usa el gradiente basado en primary_color.';
