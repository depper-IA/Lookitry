ALTER TABLE payment_settings
  ADD COLUMN IF NOT EXISTS paypal_prod_client_id text,
  ADD COLUMN IF NOT EXISTS paypal_prod_client_secret text;
