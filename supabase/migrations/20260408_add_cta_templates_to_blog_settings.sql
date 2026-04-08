-- Migration: add_cta_templates_to_blog_settings
-- Date: 2026-04-08
-- Purpose: Agregar columna para templates de CTA en blog_settings

ALTER TABLE blog_settings 
ADD COLUMN IF NOT EXISTS cta_templates jsonb DEFAULT '{
  "trial": { "title": "¿Listo para probar Lookitry?", "button_text": "Comenzar trial", "button_url": "/trial" },
  "features": { "title": "¿Quieres más conversiones?", "button_text": "Ver demo", "button_url": "/demo" },
  "pricing": { "title": "Elige tu plan", "button_text": "Ver precios", "button_url": "/planes" },
  "lead_magnet": { "title": "Descarga la guía", "button_text": "Descargar", "button_url": "/guia-descarga" }
}'::jsonb;

COMMENT ON COLUMN blog_settings.cta_templates IS 'Templates de CTA para el blog: trial, features, pricing, lead_magnet';