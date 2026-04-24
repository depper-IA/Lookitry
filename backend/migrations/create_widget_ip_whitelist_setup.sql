-- ============================================
-- LOOKITRY - Widget IP Whitelist Setup
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================

-- 1. Create the widget_ip_whitelist table
CREATE TABLE IF NOT EXISTS public.widget_ip_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address VARCHAR(45) NOT NULL UNIQUE,
  description TEXT DEFAULT ''::text,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.admins(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create index for active IPs
CREATE INDEX IF NOT EXISTS idx_widget_ip_whitelist_active ON public.widget_ip_whitelist(is_active);

-- 3. Enable RLS
ALTER TABLE public.widget_ip_whitelist ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies (allow read for all authenticated, full access for admins)
DROP POLICY IF EXISTS "widget_ip_whitelist_read_all" ON public.widget_ip_whitelist;
CREATE POLICY "widget_ip_whitelist_read_all" ON public.widget_ip_whitelist
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "widget_ip_whitelist_admin_all" ON public.widget_ip_whitelist;
CREATE POLICY "widget_ip_whitelist_admin_all" ON public.widget_ip_whitelist
  FOR ALL USING (true);

-- 5. Seed initial whitelist entries
INSERT INTO public.widget_ip_whitelist (ip_address, description)
VALUES ('161.18.87.45', 'Travis - desarrollo')
ON CONFLICT (ip_address) DO NOTHING;

INSERT INTO public.widget_ip_whitelist (ip_address, description)
VALUES ('161.18.93.138', 'Sam Wilkie')
ON CONFLICT (ip_address) DO NOTHING;

-- 6. Verify
SELECT * FROM public.widget_ip_whitelist;