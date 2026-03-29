-- Tabla de reviews de marcas (clientes del SaaS)
CREATE TABLE IF NOT EXISTS brand_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL CHECK (char_length(comment) BETWEEN 10 AND 500),
  reviewer_name text NOT NULL,
  reviewer_plan text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  is_featured bool NOT NULL DEFAULT false,
  admin_note text,
  avatar_url text DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(brand_id)
);

-- RLS: Solo el backend (service role) puede escribir/leer todo
-- El frontend nunca expone SERVICE_KEY

-- Índices
CREATE INDEX IF NOT EXISTS idx_brand_reviews_status ON brand_reviews(status);
CREATE INDEX IF NOT EXISTS idx_brand_reviews_created_at ON brand_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_brand_reviews_rating ON brand_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_brand_reviews_is_featured ON brand_reviews(is_featured);

ALTER TABLE brands ADD COLUMN IF NOT EXISTS review_prompt_shown_at timestamptz DEFAULT NULL;
