ALTER TABLE pending_registrations
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_id text NULL,
  ADD COLUMN IF NOT EXISTS updated_attimestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz NULL;
 