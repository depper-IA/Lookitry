-- Migración: Tabla de auditoría de acciones administrativas
-- Requirement 12.10: Registrar todas las acciones del admin en log de auditoría
-- Ejecutar en: https://supabase.com/dashboard/project/vkdooutklowctuudjnkl/sql/new

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id      TEXT NOT NULL,
  admin_email   TEXT NOT NULL,
  action        TEXT NOT NULL,
  target_brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  details       JSONB,
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_audit_log_admin_id      ON public.admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action        ON public.admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_brand_id      ON public.admin_audit_log(target_brand_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at    ON public.admin_audit_log(created_at DESC);

-- RLS: solo el service role puede leer/escribir (el backend usa supabaseAdmin)
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
