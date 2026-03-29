-- Normalización histórica de cuentas trial que quedaron persistidas como BASIC.
-- Objetivo:
-- 1. Corregir cuentas con rastro real de trial (`trial_end_date`) para que su plan base sea TRIAL.
-- 2. No tocar marcas con suscripción paga activa o por vencer.
--
-- Uso recomendado:
-- - Ejecutar primero los SELECT de diagnóstico.
-- - Verificar el subconjunto afectado.
-- - Ejecutar el UPDATE dentro de una transacción.

BEGIN;

-- Diagnóstico rápido: trials legacy guardados como BASIC.
SELECT
  id,
  email,
  name,
  plan,
  subscription_status,
  trial_end_date,
  subscription_end_date
FROM brands
WHERE COALESCE(plan, 'BASIC') = 'BASIC'
  AND trial_end_date IS NOT NULL
  AND COALESCE(subscription_status::text, '') NOT IN ('active', 'expiring_soon')
ORDER BY trial_end_date DESC;

-- Update seguro:
-- - Solo marcas con huella de trial.
-- - Excluye cuentas pagas.
UPDATE brands
SET
  plan = 'TRIAL',
  subscription_status = CASE
    WHEN trial_end_date > NOW() THEN 'trial'
    WHEN COALESCE(subscription_status::text, '') IN ('', 'trial') THEN 'expired'
    ELSE subscription_status
  END
WHERE COALESCE(plan, 'BASIC') = 'BASIC'
  AND trial_end_date IS NOT NULL
  AND COALESCE(subscription_status::text, '') NOT IN ('active', 'expiring_soon');

-- Resultado esperado después de la corrección.
SELECT
  id,
  email,
  name,
  plan,
  subscription_status,
  trial_end_date,
  subscription_end_date
FROM brands
WHERE plan = 'TRIAL'
ORDER BY updated_at DESC NULLS LAST, created_at DESC;

COMMIT;
