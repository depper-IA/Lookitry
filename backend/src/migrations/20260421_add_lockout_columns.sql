-- Migration: Add account lockout columns to brands
-- Adds failed_login_attempts counter and locked_until timestamp
-- for brute-force protection

ALTER TABLE public.brands
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ DEFAULT NULL;

-- Index for faster lookups on locked accounts
CREATE INDEX IF NOT EXISTS idx_brands_locked_until ON public.brands(locked_until)
WHERE locked_until IS NOT NULL;

-- comentarios para documentación
COMMENT ON COLUMN brands.failed_login_attempts IS 'Contador de intentos de login fallidos. Se resetea a 0 tras login exitoso.';
COMMENT ON COLUMN brands.locked_until IS 'Timestamp hasta el cual la cuenta está bloqueada. NULL = no bloqueada.';
