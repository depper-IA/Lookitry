DO $$
DECLARE
  plan_udt_name text;
BEGIN
  SELECT c.udt_name
  INTO plan_udt_name
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'brands'
    AND c.column_name = 'plan';

  IF plan_udt_name IS NOT NULL AND EXISTS (
    SELECT 1
    FROM pg_type t
    WHERE t.typname = plan_udt_name
      AND t.typtype = 'e'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = plan_udt_name
        AND e.enumlabel = 'TRIAL'
    ) THEN
      EXECUTE format('ALTER TYPE %I ADD VALUE ''TRIAL''', plan_udt_name);
    END IF;
  END IF;
END $$;

UPDATE brands
SET
  plan = 'TRIAL',
  subscription_status = CASE
    WHEN trial_end_date > NOW() AND COALESCE(subscription_status::text, '') IN ('', 'expired') THEN 'active'
    WHEN trial_end_date <= NOW() AND COALESCE(subscription_status::text, '') IN ('', 'expired') THEN 'expired'
    ELSE subscription_status
  END
WHERE trial_end_date IS NOT NULL
  AND COALESCE(plan, 'BASIC') = 'BASIC'
  AND COALESCE(subscription_status::text, '') NOT IN ('active', 'expiring_soon');

UPDATE brands
SET
  trial_end_date = NULL,
  trial_payment_status = NULL
WHERE COALESCE(plan, 'BASIC') <> 'TRIAL';

ALTER TABLE brands
  DROP CONSTRAINT IF EXISTS brands_trial_plan_consistency;

ALTER TABLE brands
  ADD CONSTRAINT brands_trial_plan_consistency
  CHECK (
    (plan = 'TRIAL' AND trial_end_date IS NOT NULL)
    OR plan <> 'TRIAL'
  );
