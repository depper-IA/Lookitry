alter table if exists admins
  add column if not exists reset_token text,
  add column if not exists reset_token_expires_at timestamptz;

create index if not exists idx_admins_reset_token on admins(reset_token);
