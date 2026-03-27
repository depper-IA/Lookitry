ALTER TABLE brands
  ADD COLUMN IF NOT EXISTS extra_credits_balance integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS addon_packages (
  id text PRIMARY KEY,
  name text NOT NULL,
  credits_amount integer NOT NULL CHECK (credits_amount > 0),
  price_cop integer NOT NULL CHECK (price_cop > 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO addon_packages (id, name, credits_amount, price_cop, is_active)
VALUES ('credits_500', 'Paquete 500 Generaciones Extra', 500, 50000, true)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  credits_amount = EXCLUDED.credits_amount,
  price_cop = EXCLUDED.price_cop,
  is_active = EXCLUDED.is_active,
  updated_at = now();

CREATE OR REPLACE FUNCTION consume_extra_credit(p_brand_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE brands
  SET
    extra_credits_balance = extra_credits_balance - 1,
    updated_at = now()
  WHERE id = p_brand_id
    AND extra_credits_balance > 0;

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION refund_extra_credit(p_brand_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE brands
  SET
    extra_credits_balance = extra_credits_balance + 1,
    updated_at = now()
  WHERE id = p_brand_id;
END;
$$;
