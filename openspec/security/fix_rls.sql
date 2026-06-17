-- ==========================================
-- SENTENCIAS SQL DE CORRECCIÓN DE POLÍTICAS RLS (HARDENING)
-- LOOKITRY - FASE 3
-- ==========================================
-- Propósito: Corregir las vulnerabilidades y políticas RLS laxas detectadas en la auditoría.
-- ADVERTENCIA: Estas sentencias NO deben aplicarse de forma automática.
-- Deben ser validadas y ejecutadas manualmente por el administrador de base de datos.

-- ------------------------------------------
-- 1. CREACIÓN DE LA TABLA LOGIN_AUDIT (FALTANTE)
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.login_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  email VARCHAR(255) NOT NULL,
  ip VARCHAR(45) NOT NULL,
  user_agent TEXT,
  status VARCHAR(20) CHECK (status IN ('success', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS en login_audit
-- Al no crear políticas de SELECT/UPDATE/DELETE para anon o authenticated,
-- esta tabla queda blindada contra acceso directo de usuarios y es solo accesible por service_role (backend).
ALTER TABLE public.login_audit ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------
-- 2. HABILITAR RLS EN REBECCA_MESSAGE_RATINGS
-- ------------------------------------------
-- La tabla rebecca_message_ratings fue creada pero no se le habilitó RLS.
ALTER TABLE public.rebecca_message_ratings ENABLE ROW LEVEL SECURITY;

-- Al igual que login_audit, no creamos políticas de SELECT/UPDATE/DELETE públicas.
-- El backend lee y escribe las calificaciones usando el service_role (supabaseAdmin).

-- ------------------------------------------
-- 3. HARDENING EN LA TABLA BRANDS (VULNERABILIDAD CRÍTICA)
-- ------------------------------------------
-- La política actual permite a cualquier usuario anon/public realizar SELECT de marcas,
-- exponiendo campos sensibles como hash de contraseñas (password) y api_key.

-- Eliminar políticas antiguas e inseguras
DROP POLICY IF EXISTS "Public brand data readable by anon" ON public.brands;
DROP POLICY IF EXISTS "Brands can view own data" ON public.brands;

-- Crear política para que las marcas puedan SELECT de su propio registro completo
CREATE POLICY "Brands can view own data" 
ON public.brands FOR SELECT TO public
USING (id::text = (current_setting('request.jwt.claims'::text, true))::json->>'brandId');

-- Aplicar seguridad a nivel de columnas (Column-Level Security)
-- 1. Revocar SELECT general en la tabla para anon y authenticated
REVOKE SELECT ON public.brands FROM anon, authenticated;

-- 2. Conceder SELECT únicamente en columnas públicas y no sensibles para la operación del widget/landing
GRANT SELECT (
    id, name, slug, logo, primary_color, secondary_color, contact_name, 
    phone, address, city, country, website, welcome_message, cta_button_text, 
    social_links, has_landing_page, city_display, national_shipping, 
    whatsapp_message, rating, total_reviews, landing_template, schedule, 
    slogan, logo_light, logo_dark, cover_bg_color, cover_overlay_opacity, 
    show_brand_name, landing_font, widget_bg_color, state_province, 
    postal_code, widget_product_ids, share_message, widget_cover_image,
    subscription_status, plan, trial_end_date, created_at, updated_at
) ON public.brands TO anon, authenticated;

-- 3. Crear política para que anon/authenticated puedan SELECT (de los campos permitidos)
CREATE POLICY "Public brand widget data readable by anon" 
ON public.brands FOR SELECT TO anon, authenticated
USING (true);

-- ------------------------------------------
-- 4. CORRECCIÓN EN LA TABLA PRODUCTS (LAX_POLICY_WARNING)
-- ------------------------------------------
-- Eliminar política laxa que permite visualizar todos los productos (incluso inactivos)
DROP POLICY IF EXISTS "Products viewable by all" ON public.products;

-- Crear política para que el público solo pueda ver productos activos
CREATE POLICY "Active products viewable by all" 
ON public.products FOR SELECT TO anon, authenticated
USING (is_active = true);

-- Crear política para que el dueño de la marca pueda ver todos sus productos (incluyendo inactivos)
CREATE POLICY "Brands can view own products" 
ON public.products FOR SELECT TO public
USING (brand_id::text = (current_setting('request.jwt.claims'::text, true))::json->>'brandId');

-- ------------------------------------------
-- 5. CORRECCIÓN EN LA TABLA LEADS (LAX_POLICY_CRITICAL)
-- ------------------------------------------
-- Eliminar política que permite a cualquier usuario 'authenticated' leer todos los leads.
-- Dado que el backend gestiona todo mediante el service_role (que salta RLS), 
-- no es necesario tener políticas de lectura públicas en esta tabla.
DROP POLICY IF EXISTS "leads_auth_read" ON public.leads;
