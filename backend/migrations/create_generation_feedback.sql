-- ============================================================
-- Migración: create_generation_feedback
-- Tabla para almacenar feedback de errores en generaciones de imágenes.
-- Alimenta el sistema RAG de mejora continua de prompts.
-- ============================================================

-- Habilitar extensión pgvector si no está activa
CREATE EXTENSION IF NOT EXISTS vector;

-- Tipo enum para categorías de error
DO $$ BEGIN
  CREATE TYPE generation_error_type AS ENUM (
    'wrong_clothing_removed',   -- Se eliminó ropa que debía conservarse (ej: zapatos al poner vestido)
    'wrong_clothing_kept',      -- Se conservó ropa que debía eliminarse (ej: pantalón bajo vestido)
    'body_distortion',          -- Distorsión corporal (proporciones, extremidades)
    'color_wrong',              -- Color del producto incorrecto
    'product_not_applied',      -- El producto no se aplicó visiblemente
    'background_changed',       -- El fondo cambió cuando no debía
    'other'                     -- Otro tipo de error
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Tabla principal de feedback
CREATE TABLE IF NOT EXISTS generation_feedback (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id     UUID NOT NULL REFERENCES generations(id) ON DELETE CASCADE,
  brand_id          UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,

  -- Tipo de error reportado
  error_type        generation_error_type NOT NULL DEFAULT 'other',

  -- Descripción libre del cliente (opcional)
  description       TEXT,

  -- Categoría del producto al momento del error (inferida del producto)
  product_category  TEXT,

  -- Prompt exacto que se usó en la generación fallida (para RAG)
  prompt_used       TEXT,

  -- Embedding vectorial del feedback (768 dimensiones — text-embedding-004 de Google)
  -- Se genera de forma asíncrona vía n8n después de guardar el registro
  embedding         vector(768),

  -- Si el admin ya revisó y marcó como resuelto
  resolved          BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at       TIMESTAMPTZ,
  resolved_by       TEXT,  -- email del admin que lo resolvió

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_generation_feedback_brand_id
  ON generation_feedback(brand_id);

CREATE INDEX IF NOT EXISTS idx_generation_feedback_error_type
  ON generation_feedback(error_type);

CREATE INDEX IF NOT EXISTS idx_generation_feedback_resolved
  ON generation_feedback(resolved);

CREATE INDEX IF NOT EXISTS idx_generation_feedback_product_category
  ON generation_feedback(product_category);

CREATE INDEX IF NOT EXISTS idx_generation_feedback_created_at
  ON generation_feedback(created_at DESC);

-- Índice vectorial para similarity search (RAG)
-- Usa ivfflat para búsqueda aproximada eficiente
CREATE INDEX IF NOT EXISTS idx_generation_feedback_embedding
  ON generation_feedback USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_generation_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generation_feedback_updated_at ON generation_feedback;
CREATE TRIGGER trg_generation_feedback_updated_at
  BEFORE UPDATE ON generation_feedback
  FOR EACH ROW EXECUTE FUNCTION update_generation_feedback_updated_at();

-- RLS: solo el service_role puede acceder (el backend usa service_role)
ALTER TABLE generation_feedback ENABLE ROW LEVEL SECURITY;

-- Política: acceso total para service_role (backend)
CREATE POLICY "service_role_full_access" ON generation_feedback
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Función de similarity search para el RAG
-- Retorna los feedbacks más similares a un embedding dado
CREATE OR REPLACE FUNCTION search_similar_feedback(
  query_embedding vector(768),
  similarity_threshold FLOAT DEFAULT 0.3,
  max_results INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  error_type generation_error_type,
  description TEXT,
  product_category TEXT,
  prompt_used TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    gf.id,
    gf.error_type,
    gf.description,
    gf.product_category,
    gf.prompt_used,
    1 - (gf.embedding <=> query_embedding) AS similarity
  FROM generation_feedback gf
  WHERE
    gf.resolved = FALSE
    AND gf.embedding IS NOT NULL
    AND 1 - (gf.embedding <=> query_embedding) >= similarity_threshold
  ORDER BY gf.embedding <=> query_embedding
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;
