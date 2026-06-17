-- ==========================================
-- SCRIPT DE AUDITORÍA DE SEGURIDAD DE BASE DE DATOS
-- LOOKITRY - FASE 3
-- ==========================================
-- Propósito: Verificar periódicamente el estado de seguridad de la base de datos, 
-- privilegios de roles y configuración de RLS en tablas sensibles.
-- Ejecución: Este script puede ser ejecutado directamente en la consola SQL de Supabase 
-- o vía psql.

\echo '=== 1. VERIFICACIÓN DE PRIVILEGIOS DE ROLES (Least Privilege) ==='
-- Ninguno de los roles accesibles por el backend o el público (anon, authenticated, service_role)
-- debe ser superusuario (rolsuper = true).
SELECT 
    rolname AS rol_usuario, 
    rolsuper AS es_superusuario, 
    rolbypassrls AS salta_rls,
    rolcanlogin AS puede_loguearse
FROM 
    pg_roles
WHERE 
    rolname IN ('anon', 'authenticated', 'service_role', 'postgres', 'supabase_admin')
ORDER BY 
    rol_usuario;

\echo '=== 2. VERIFICACIÓN DEL ESTADO DE TABLAS SENSIBLES Y RLS ==='
-- Consulta la vista db_security_audit para obtener un reporte rápido del estado de seguridad.
SELECT * FROM public.db_security_audit;

\echo '=== 3. ANÁLISIS DE POLÍTICAS LAXAS / PERMISIVAS ==='
-- Lista las políticas que permiten acceso 'true' (sin filtro) a roles públicos/anon/authenticated.
SELECT 
    schemaname,
    tablename,
    policyname,
    roles,
    cmd AS comando,
    qual AS condicion_filtro,
    with_check AS condicion_chequeo
FROM 
    pg_policies
WHERE 
    schemaname = 'public' 
    AND (roles && '{public,anon,authenticated}'::name[] OR roles = '{public}'::name[])
    AND (qual = 'true'::text OR with_check = 'true'::text)
    AND tablename IN ('brands', 'products', 'generations', 'leads', 'subscription_payments', 'login_audit', 'admins')
ORDER BY 
    tablename, policyname;

\echo '=== 4. LISTADO COMPLETO DE TABLAS CON RLS DESACTIVADO ==='
-- Lista todas las tablas del esquema público que no tienen RLS habilitado (excluyendo vistas).
SELECT 
    t.tablename,
    c.relrowsecurity AS rls_habilitado
FROM 
    pg_tables t
JOIN 
    pg_class c ON (c.relname = t.tablename AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = t.schemaname))
WHERE 
    t.schemaname = 'public'
    AND NOT c.relrowsecurity
ORDER BY 
    t.tablename;
