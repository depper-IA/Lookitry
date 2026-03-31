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
