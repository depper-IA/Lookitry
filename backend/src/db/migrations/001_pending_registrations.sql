CREATE TABLE pending_registrations (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text        NOT NULL,
  reference   text        NOT NULL,
  plan        text        NOT NULL,
  months      integer     NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pending_registrations_reference_key UNIQUE (reference)
);

-- RLS: deshabilitado (solo acceso desde service role via supabaseAdmin)
ALTER TABLE pending_registrations DISABLE ROW LEVEL SECURITY;
