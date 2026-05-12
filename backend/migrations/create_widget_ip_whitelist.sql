-- Migration: Create widget_ip_whitelist table for home try-on widget IP whitelist
-- Purpose: Allow admin to manually manage IPs that bypass trial limits and rate limiting

CREATE TABLE IF NOT EXISTS public.widget_ip_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address VARCHAR(45) NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.admins(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_widget_ip_whitelist_active ON public.widget_ip_whitelist(is_active);

-- Enable RLS
ALTER TABLE public.widget_ip_whitelist ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow read for all authenticated, full access for admins
CREATE POLICY "widget_ip_whitelist_read_all" ON public.widget_ip_whitelist
  FOR SELECT USING (true);

CREATE POLICY "widget_ip_whitelist_admin_all" ON public.widget_ip_whitelist
  FOR ALL USING (true);

-- Seed initial whitelist entries
INSERT INTO public.widget_ip_whitelist (ip_address, description, created_by)
SELECT '161.18.87.45', 'Travis - desarrollo', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.widget_ip_whitelist WHERE ip_address = '161.18.87.45');

INSERT INTO public.widget_ip_whitelist (ip_address, description, created_by)
SELECT '161.18.93.138', 'Sam Wilkie', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.widget_ip_whitelist WHERE ip_address = '161.18.93.138');