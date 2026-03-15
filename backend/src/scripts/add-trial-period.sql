-- Migración: Agregar campo trial_end_date a tabla brands
-- Requirement: 11 (Opción C) - Período de prueba gratuito

-- Agregar columna trial_end_date
ALTER TABLE brands
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ;

-- Agregar columna trial_generations_limit para créditos del período de prueba
ALTER TABLE brands
ADD COLUMN IF NOT EXISTS trial_generations_limit INTEGER DEFAULT 30;

-- Para marcas existentes sin suscripción activa, establecer trial vencido
-- (no afecta marcas con suscripción activa)
UPDATE brands
SET trial_end_date = created_at + INTERVAL '7 days'
WHERE trial_end_date IS NULL
  AND subscription_status IS NULL;

-- Comentario: Al registrarse, trial_end_date = now() + 7 días
-- con 30 créditos de generación (atractivo pero conservador en costo)
